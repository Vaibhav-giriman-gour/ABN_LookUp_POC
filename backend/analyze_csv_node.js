import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

async function analyzeCsvSchema(filePath) {
    console.log(`\n--- Analyzing: ${filePath} ---`);
    const maxLengths = {};
    const numericRanges = {}; // { col: { min: val, max: val, hasDecimal: bool } }
    const missingCounts = {};
    const columnNames = [];
    let rowCount = 0;
    const sampleRows = []; // To capture a few rows for inspection

    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist at: ${filePath}`);
        }

        const parser = fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                trim: true,
                // --- NEW OPTIONS FOR ROBUSTNESS ---
                relax_column_count: true, // Allow rows to have different column counts
                skip_records_with_error: true, // Skip records that cause parsing errors (e.g., severe malformations)
                // --- END NEW OPTIONS ---
            }));

        for await (const record of parser) {
            if (rowCount < 5) { // Capture first 5 rows for sample
                sampleRows.push(record);
            }

            if (rowCount === 0) {
                Object.keys(record).forEach(col => {
                    columnNames.push(col);
                    maxLengths[col] = 0;
                    missingCounts[col] = 0;
                    numericRanges[col] = { min: Infinity, max: -Infinity, hasDecimal: false };
                });
            }
            rowCount++;

            for (const col of columnNames) { // Iterate over *detected* column names
                const value = record[col]; // Access value by detected column name

                if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                    missingCounts[col]++;
                } else {
                    const currentLength = String(value).length;
                    if (currentLength > maxLengths[col]) {
                        maxLengths[col] = currentLength;
                    }

                    const numValue = Number(value);
                    if (!isNaN(numValue) && typeof value === 'string' && value.trim() !== '') {
                        if (numValue < numericRanges[col].min) {
                            numericRanges[col].min = numValue;
                        }
                        if (numValue > numericRanges[col].max) {
                            numericRanges[col].max = numValue;
                        }
                        if (String(value).includes('.')) {
                            numericRanges[col].hasDecimal = true;
                        }
                    }
                }
            }
        }

        console.log(`Total rows processed: ${rowCount}`);

        console.log("\nSample Data (first few rows):");
        sampleRows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
        });

        console.log("\nMaximum Lengths for String/Object Columns:");
        for (const col of columnNames) {
            const isLikelyNumeric = !isNaN(numericRanges[col].min) && !isNaN(numericRanges[col].max) && numericRanges[col].min !== Infinity;

            if (isLikelyNumeric && !numericRanges[col].hasDecimal && maxLengths[col] <= 19) {
                 console.log(`  ${col}: Integer (Min: ${numericRanges[col].min}, Max: ${numericRanges[col].max}, Max String Length: ${maxLengths[col]})`);
            } else if (isLikelyNumeric && numericRanges[col].hasDecimal) {
                 console.log(`  ${col}: Float/Numeric (Min: ${numericRanges[col].min}, Max: ${numericRanges[col].max}, Max String Length: ${maxLengths[col]})`);
            } else {
                console.log(`  ${col}: ${maxLengths[col]} characters`);
            }
        }

        console.log("\nMissing Values (Count per column):");
        console.log(missingCounts);

    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
        // Log the full error object for more detail if needed
        if (error.code === 'CSV_RECORD_INCONSISTENT_COLUMNS') {
            console.error(`CSV Parsing Error Details:`);
            console.error(`  Code: ${error.code}`);
            console.error(`  Expected Columns: ${error.columnsLength}`);
            console.error(`  Found Columns: ${error.record.length}`);
            console.error(`  Line Number: ${error.lines}`);
            console.error(`  Record Content (problematic line): ${JSON.stringify(error.record)}`);
        }
    }
}

// --- HARDCODE THE ABSOLUTE PATHS HERE (as we did last time) ---
const absoluteDataFolderPath = 'D:/WebProjects/Lookup-Poc/data'; // <--- **VERIFY THIS IS STILL CORRECT**

const entitiesCsvPath = path.join(absoluteDataFolderPath, 'entities.csv');
const otherNamesCsvPath = path.join(absoluteDataFolderPath, 'other_names.csv');

console.log(`Attempting to open entities.csv at: ${entitiesCsvPath}`);
console.log(`Attempting to open other_names.csv at: ${otherNamesCsvPath}`);

analyzeCsvSchema(entitiesCsvPath);
analyzeCsvSchema(otherNamesCsvPath);