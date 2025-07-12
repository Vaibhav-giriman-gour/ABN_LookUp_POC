import { Pool } from "pg"; // --- Postgres client
import express from "express";
import cors from "cors"; // --- Cross-Origin Resource Sharing
import dotenv from "dotenv"; // --- Environment variables
import winston from "winston";
dotenv.config(); // --- Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000; // --- Default port

// --- Configure winston logger
const logger = winston.createLogger({
    // --- Set the log level based on NODE_ENV
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        // --- Add timestamp
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        // --- Use different log formats based on NODE_ENV
        process.env.NODE_ENV === "production"
            ? winston.format.json()
            : winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
            )
    ),
    // --- Configure transports, Define where logs go
    transports: [
        // --- Write logs to a file
        new winston.transports.File({ filename: "error.log", level: "error" }),
        // --- Always log to a combined file for all levels
        new winston.transports.File({ filename: "combined.log" }),
    ],
    // --- Configure exception handlers
    exceptionHandlers: [
        new winston.transports.File({ filename: "exceptions.log" }),
    ],
    // --- Configure rejection handlers
    rejectionHandlers: [
        new winston.transports.File({ filename: "rejections.log" }),
    ],
});

// --- Middleware
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- Connect to the database
pool
    .connect()
    .then((client) => {
        logger.info("Successfully Connected to the PG database!");
        client.release();
    })
    .catch((error) => {
        logger.error("Error connecting to the PG database:", error);
    });

// --- API Route --- //
app.get("/api/abns", async (req, res) => {
    try {
        // --- Query parameters
        const {
            q,
            state,
            postcode,
            entityType,
            abnStatus,
            page = 1,
            limit = 10,
        } = req.query;
        // --- Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);
        if (isNaN(offset) || isNaN(parsedLimit) || offset < 0 || parsedLimit <= 0) {
            logger.warn(
                `Invalid pagination parameters received: page=${page}, limit=${limit}`
            );
            return res
                .status(400)
                .json({
                    message:
                        "Invalid pagination parameters, Page and limit must be positive numbers.",
                });
        }
        let whereClauses = [];
        let queryParams = [];
        let paramIndex = 1;
        // --- Build the query based on query parameters
        let query = `
                    SELECT
                e.abn,
                e.legal_name,
                e.entity_type,
                e.abn_status,
                e.main_location_state,
                e.main_location_postcode
            FROM
                entities e
        `;
        let countQuery = `
            SELECT
                COUNT(DISTINCT e.abn)
            FROM
                entities e
        `;
        if(q) {
            // --- Search by ABN
            const searchTerm = `%${q.toLowerCase()}%`;
            query += ` LEFT JOIN other_names onames ON e.abn = onames.abn`;
            countQuery += ` LEFT JOIN other_names onames ON e.abn = onames.abn`;
            // --- Add the search term to the WHERE clause
            whereClauses.push(`(LOWER(e.legal_name) ILIKE $${paramIndex} OR LOWER(e.abn) ILIKE $${paramIndex} OR LOWER(onames.name) ILIKE $${paramIndex})`);
            queryParams.push(searchTerm);
            paramIndex++;
        }
        // --- Filters (apply to entities table)
        if(state){
            // --- Search by state
            whereClauses.push(`LOWER(e.main_location_state) = LOWER($${paramIndex})`);
            queryParams.push(state);
            paramIndex++;
        }
        if(postcode){
            // --- Search by postcode
            whereClauses.push(`LOWER(e.main_location_postcode) = LOWER($${paramIndex})`);
            queryParams.push(postcode);
            paramIndex++;
        }
        if(entityType){
            // --- Search by entity type
            whereClauses.push(`LOWER(e.entity_type) = LOWER($${paramIndex})`);
            queryParams.push(entityType);
            paramIndex++;
        }
        if(abnStatus){
            // --- Search by ABN status
            whereClauses.push(`LOWER(e.abn_status) = LOWER($${paramIndex})`);
            queryParams.push(abnStatus);
            paramIndex++;
        }
        // --- Add WHERE clause if filters exist
        if(whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(" AND ")}`;
            countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
        }
        // ---  Group by to avoid duplicate entities when joining other_names for keyword search
        if (q) {
            query += `
                GROUP BY
                    e.abn, e.legal_name, e.entity_type, e.abn_status, e.main_location_state, e.main_location_postcode
            `;
        }
        query += `
            ORDER BY e.abn ASC`

        logger.debug(`Executing count query: ${countQuery} with params: ${JSON.stringify(queryParams)}`);
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // --- Add pagination limits
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parsedLimit, offset);

        logger.debug(`Executing main query: ${query} with params: ${JSON.stringify(queryParams)}`);
        const result = await pool.query(query, queryParams);

        logger.info(`Search API: q='${q}', state='${state}', postcode='${postcode}', entitiesFound=${result.rows.length}, total=${totalCount}`);
        res.json({
            totalCount,
            currentPage: parseInt(page),
            limit: parsedLimit,
            abns: result.rows
        });
    } catch (err) {
        console.error('*** RAW ERROR FROM API SEARCH QUERY ***', err); // ADD THIS LINE
        logger.error('Error executing ABN search query:', err.message, { stack: err.stack, queryParams: req.query });
        res.status(500).json({ error: 'Internal server error during search.' });
    }
});


// --- GET /api/abns/:abn - Get full details for a specific ABN
app.get('/api/abns/:abn', async (req, res) => {
    try {
        const { abn } = req.params;

        if (!abn || abn.length !== 11 || !/^\d+$/.test(abn)) {
            logger.warn(`Invalid ABN format requested for detail: ${abn}`);
            return res.status(400).json({ error: 'Invalid ABN format. ABN must be an 11-digit number.' });
        }

        // --- Query main entity details
        const entityQuery = `
            SELECT
                abn, legal_name, entity_type, abn_status, abn_status_date,
                gst_status, gst_registration_date, dgr_status, dgr_effective_date,
                acn_arbn, main_location_state, main_location_postcode
            FROM
                entities
            WHERE
                abn = $1
        `;
        logger.debug(`Executing entity detail query for ABN: ${abn}`);
        const entityResult = await pool.query(entityQuery, [abn]);

        if (entityResult.rows.length === 0) {
            logger.info(`ABN not found: ${abn}`);
            return res.status(404).json({ error: 'ABN not found.' });
        }

        const entityDetails = entityResult.rows[0];

        // --- Query associated other names
        const otherNamesQuery = `
            SELECT
                name_type, name
            FROM
                other_names
            WHERE
                abn = $1
            ORDER BY name_type, name
        `;
        logger.debug(`Executing other names detail query for ABN: ${abn}`);
        const otherNamesResult = await pool.query(otherNamesQuery, [abn]);

        logger.info(`ABN details retrieved for: ${abn}`);
        res.json({
            ...entityDetails,
            other_names: otherNamesResult.rows
        });

    } catch (err) {
        logger.error(`Error executing ABN detail query for ABN ${req.params.abn}:`, err.message, { stack: err.stack });
        res.status(500).json({ error: 'Internal server error retrieving ABN details.' });
    }
});


// --- Basic welcome route (for testing if API is running)
app.get('/', (req, res) => {
    logger.info('Root API endpoint accessed.');
    res.send('ABN Lookup API is running!');
});


// Start the server
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`Access API at http://localhost:${port}`);
});
