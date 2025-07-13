import fs from 'fs';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import path from 'path';

// A simple regex to check if a string looks like an ABN (11 digits)
const ABN_REGEX = /^\d{11}$/; // Strictly 11 digits

// New: Max rows to process for entities and other_names
// We know entities took ~5.5M rows to fill 1GB.
// Let's target something safe, like 4M rows for entities initially.
// For other_names, it's 3M rows, which might also be too big, let's also limit it.
// You might need to adjust these numbers based on how much data 1GB can hold.
// 4,000,000 rows for entities and 2,000,000 for other_names as a starting point.
const MAX_ENTITIES_DATA_ROWS = 4000000;
const MAX_OTHER_NAMES_DATA_ROWS = 2000000;


async function cleanCsv(inputFilePath, outputFilePath, expectedColumnCount, maxDataRowsToProcess = Infinity) {
    console.log(`\n--- Starting Cleaning Process for: ${inputFilePath} ---`);
    console.log(`Output file will be: ${outputFilePath}`);
    console.log(`Expected column count: ${expectedColumnCount}`);
    if (maxDataRowsToProcess !== Infinity) {
        console.log(`Limiting to ${maxDataRowsToProcess} data rows.`);
    }

    let headers = null;
    let processedInputLines = 0; // Total lines read from input file (including header)
    let processedDataRows = 0;   // Count of actual data rows processed (excluding header)
    let paddedRows = 0;
    let skippedInvalidAbnRows = 0;
    const recordsToWrite = []; // Stores all rows (including header) as arrays of values

    try {
        if (!fs.existsSync(inputFilePath)) {
            throw new Error(`Input file does not exist at: ${inputFilePath}`);
        }

        const parser = fs.createReadStream(inputFilePath)
            .pipe(parse({
                columns: false,
                skip_empty_lines: true,
                relax_quotes: true,
                trim: true,
                relax_column_count: true,
                skip_records_with_error: true,
            }));

        for await (const record of parser) {
            processedInputLines++;

            if (processedInputLines === 1) { // First line is always the header
                headers = record;
                if (headers.length !== expectedColumnCount) {
                    console.warn(`WARNING: Header for ${inputFilePath} has ${headers.length} columns, but expected ${expectedColumnCount}. Adjusting expected count to header length for processing.`);
                    expectedColumnCount = headers.length;
                }
                recordsToWrite.push(headers); // Add header back to the records to be written
                continue; // Skip further processing for the header line
            }

            // --- New: Limit processing based on maxDataRowsToProcess ---
            if (maxDataRowsToProcess !== Infinity && processedDataRows >= maxDataRowsToProcess) {
                console.log(`Limit of ${maxDataRowsToProcess} data rows reached for ${inputFilePath}. Stopping parsing.`);
                break; // Exit the loop
            }
            // --- End New Limit Logic ---


            const rowAsArray = [...record]; // Create a mutable copy

            // ABN VALIDATION LOGIC (only for entities.csv)
            if (inputFilePath.includes('entities.csv')) {
                const abnCandidate = rowAsArray[0];
                if (!abnCandidate || !ABN_REGEX.test(abnCandidate.replace(/\s/g, ''))) {
                    skippedInvalidAbnRows++;
                    continue; // Skip this row entirely
                }
            }

            // Padding logic
            if (rowAsArray.length < expectedColumnCount) {
                const diff = expectedColumnCount - rowAsArray.length;
                for (let i = 0; i < diff; i++) {
                    rowAsArray.push('');
                }
                paddedRows++;
            }
            if (rowAsArray.length > expectedColumnCount) {
                rowAsArray.splice(expectedColumnCount);
            }

            recordsToWrite.push(rowAsArray);
            processedDataRows++; // Increment count only for actual data rows processed

            if (processedDataRows % 100000 === 0) {
                process.stdout.write(`Processed ${processedDataRows} data rows from ${inputFilePath}...\r`);
            }
        }

        if (!headers) {
            throw new Error(`CSV file "${inputFilePath}" is empty or missing header.`);
        }

        console.log(`\nFinished parsing ${processedDataRows} data rows from ${inputFilePath}. Padded ${paddedRows} rows.`);
        if (skippedInvalidAbnRows > 0) {
            console.warn(`Skipped ${skippedInvalidAbnRows} rows due to invalid ABN format.`);
        }


        const outputStream = fs.createWriteStream(outputFilePath);
        const stringifier = stringify();
        stringifier.pipe(outputStream);

        for (const recordArray of recordsToWrite) {
            stringifier.write(recordArray);
        }
        stringifier.end();

        await new Promise((resolve, reject) => {
            outputStream.on('error', reject);
            outputStream.on('finish', resolve);
        });

        console.log(`Cleaned data successfully written to: ${outputFilePath}`);

    } catch (error) {
        console.error(`FATAL ERROR during CSV cleaning for ${inputFilePath}:`, error);
        throw error;
    }
}

// --- Configuration ---
const dataFolderPath = 'D:/WebProjects/Lookup-Poc/data';

const entitiesInputPath = path.join(dataFolderPath, 'entities.csv');
const entitiesOutputPath = path.join(dataFolderPath, 'entities_cleaned.csv');
const expectedEntitiesColumns = 12;

const otherNamesInputPath = path.join(dataFolderPath, 'other_names.csv');
const otherNamesOutputPath = path.join(dataFolderPath, 'other_names_cleaned.csv');
const expectedOtherNamesColumns = 3;

async function runCleaning() {
    console.log("\n--- Starting overall CSV cleaning process (subset) ---");
    try {
        await cleanCsv(entitiesInputPath, entitiesOutputPath, expectedEntitiesColumns, MAX_ENTITIES_DATA_ROWS); // Pass limit
        await cleanCsv(otherNamesInputPath, otherNamesOutputPath, expectedOtherNamesColumns, MAX_OTHER_NAMES_DATA_ROWS); // Pass limit
        console.log("\nCSV cleaning process completed successfully for both files (subset)!");
        console.log("You can now try importing 'entities_cleaned.csv' and 'other_names_cleaned.csv'");
        console.log("NOTE: Only a subset of the original data was processed due to disk space limitations.");
    } catch (error) {
        console.error("Overall CSV cleaning process (subset) failed.");
    }
}

runCleaning();