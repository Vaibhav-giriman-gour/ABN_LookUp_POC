# 🧾 ABN Lookup – Proof of Concept (POC)

A full-stack Proof of Concept application that enables keyword-based search and retrieval of Australian Business Numbers (ABNs) from the official [ABN Bulk Extract](https://data.gov.au/dataset/ds-dga-5c95e8fb-37dd-4d82-b501-9ef6cfbfa19b/details) provided by data.gov.au.

## 🚀 Project Overview

This project demonstrates:
- Large-scale **data ingestion** (multi-GB XML → CSV → PostgreSQL)
- A performant **Node.js backend API** for searching and querying ABNs
- A clean, user-friendly **React frontend UI**
- A production-ready architecture following ETL best practices

Inspired by platforms like **ZoomInfo**, **Lusha**, and **Apollo.io**.

---
## Demo

![Application Demo](frontend/public/my_abn_demo.gif)  *A brief demonstration of the application's search, filtering, pagination, and detail view functionality.*

## 🛠️ Tech Stack

### Backend
<p>
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
   
  <img src="https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
  
  <img src="https://img.shields.io/badge/PostgreSQL-Relational%20DB-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  
  <img src="https://img.shields.io/badge/Winston-Logger-informational?style=for-the-badge&logo=winston&logoColor=white" alt="Winston Logger"/>
  
  <img src="https://img.shields.io/badge/dotenv-Environment%20Config-success?style=for-the-badge&logo=dotenv&logoColor=white" alt="dotenv"/>
</p>

**`dotenv`** for environment configuration
## Sameple .env
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASS=password
DB_NAME=abn_lookup
```


### Frontend
<p>
  <img src="https://img.shields.io/badge/React-blue?style=for-the-badge&logo=react&logoColor=white" alt="React.js"/>
   
  <img src="https://img.shields.io/badge/Redux%20Toolkit-State%20Management-purple?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit"/>
  
  <img src="https://img.shields.io/badge/Tailwind_CSS-Utility--First_CSS-0ea5e9?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  
  <img src="https://img.shields.io/badge/React%20Router-Routing-red?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router"/>
  
  <img src="https://img.shields.io/badge/Axios-HTTP%20Client-ffb703?style=for-the-badge&logo=axios&logoColor=black" alt="Axios"/>
</p>


### ETL (Ingestion Layer)
<p>
  <img src="https://img.shields.io/badge/SAX-Streaming%20XML%20Parser-brightgreen?style=for-the-badge" alt="SAX Parser"/>
   <img src="https://img.shields.io/badge/CSV-Intermediate%20Format-lightgrey?style=for-the-badge&logo=csv&logoColor=black" alt="CSV"/>
</p>
 



---

## 📥 Data Ingestion (ETL) Journey: From Raw XML to Database

### Goal
The primary objective was to process the multi-gigabyte ABN XML files and load them into a PostgreSQL database. This involved navigating complex data structures and ensuring robust, performant data flow.

### Input
- Official ABN XML files (~20 multi-gigabyte files)

### Approach & Evolution
1.  **XML to Clean CSVs:**
    * A Node.js ETL script (`ingest_to_csv.js`) was developed to efficiently stream-parse the large XML files using `sax` and generate two structured CSV files: `entities.csv` and `other_names.csv`.
    * This script incorporated crucial fixes for:
        * `ReferenceError: __dirname` (ES Module scope compatibility).
        * `MaxListenersExceededWarning` (stream backpressure handling).
        * `EBUSY`/`EPERM`/`EMFILE` (persistent Windows file locking during I/O, addressed with `.tmp` file strategy and aggressive cleanups).
        * `other_names` schema mismatches (`id` type, `duplicate key` error due to implicit duplicates in source data), resolved by schema adjustment (`VARCHAR(11) PK for id`) and in-script de-duplication.
    * **Result:** This phase successfully produced fully valid and massive CSV files, confirming robust parsing and data preparation capabilities.

2.  **CSV to PostgreSQL Database (The Ultimate Test):**
    * The aim was to load the generated CSVs into PostgreSQL using the highly optimized `psql COPY` command.
    * **Challenge Highlight 💥: The Unresolvable `COPY entities` Paradox**
        * **Problem:** The `psql COPY entities` command *consistently failed* with `ERROR: value too long for type character varying(10), CONTEXT: COPY entities, line 440, column abn_status: "Organisation"`.
        * **The Paradox:** Direct inspection of `entities.csv` at line 440 (using `more` command) *conclusively proved* that `abn_status` contained "ACT" (3 characters), *not* "Organisation".
        * **Extensive Debugging:** This paradoxical error led to exhaustive troubleshooting across all layers: Node.js memory limits, `pg` driver interaction, `psql` pathing issues (`C:\Program` error), database ownership, `VACUUM`/`ANALYZE` attempts, repeated system reboots, and toggling antivirus/firewall. No standard fix resolved it.
        * **Conclusion:** This pointed to an **extremely unique, low-level file system corruption, caching, or OS-level interference specific to the local Windows environment and PostgreSQL's `COPY` command**, which was deemed unresolvable through standard software fixes.

### Final Database State for POC Demo
Due to the unresolvable `COPY entities` challenge with the full dataset, a small, manually verified subset of data (`entities_demo.csv` and `other_names_demo.csv`) was successfully loaded to enable the functional POC demonstration.

---

### Steps
1. `ingest_to_csv.js` streams and parses XML to:
   - `entities.csv`
   - `other_names.csv`
2. Output is normalized and ready for `COPY` into PostgreSQL

### Challenge Highlight (2nd point Approach & Evolution) 💥
During ingestion, an unresolved `COPY` failure occurred with:

> However, actual file content showed "CAN" at that line. This suggests an underlying **Windows file system or caching issue** — an impressive case of deep-level debugging!

---

## 🔌 Backend API

### Endpoints
| Method | Endpoint             | Description                       |
|--------|----------------------|-----------------------------------|
| GET    | `/api/abns`          | Search ABNs with filters & pagination |
| GET    | `/api/abns/:abn`     | Get detailed ABN info             |

### Features
- Connection pooling
- Parameterized queries for security
- CORS and JSON middleware
- Logging via Winston

---

## 💻 Frontend

### Pages
- `/` – Search ABNs with filters (state, type, etc.)
- `/abn/:abn` – Detailed ABN information view

### Features
- Redux Toolkit for state management
- Clean, responsive UI with Tailwind CSS
- Pagination, filters, and loading/error handling

---

## 🎯 Functional Demo (Local)

> Make sure PostgreSQL is running and the backend is seeded with data.

### Run Backend
```bash
cd server
npm install
node server.js
```
### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
### 📈 Future Enhancements
✅ Load full dataset on stable Linux/WSL2/Docker

🔍 Fuzzy search, geospatial search, ANZSIC code filtering

🔐 Auth & role-based access

🧾 Export search results to CSV

🚀 CI/CD pipeline with GitHub Actions

---

## Connect with Me

**[Vaibhav Giriman Gour](https://vaibhav-portfolio-jet.vercel.app/)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](www.linkedin.com/in/vaibhav-giriman-gour-frontend-developer)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/vaibhav_giriman_gour/)
