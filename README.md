# AgResearch Labs API

A backend REST API built for managing agricultural trays, crop batches, growth stages, harvest records, and yield reports.

The project demonstrates a structured backend implementation using **TypeScript, Fastify, PostgreSQL, and automated testing**, with business rules enforced at the service and database levels.

---

## Tech Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- `pg`
- Vitest
- dotenv

---

## Features

### Tray Management

- Create a new tray
- List all trays
- Retrieve a tray by ID
- Validate tray input
- Prevent duplicate tray codes
- Enforce positive tray capacity

### Batch Management

- Create crop batches associated with trays
- Retrieve a batch by ID
- List batches with pagination
- Filter batches by:
  - Stage
  - Crop
  - Zone
- Prevent multiple active batches on the same tray

### Batch Stage Management

Batch stages follow a strict sequential workflow:

```text
SEEDED
   ↓
GERMINATION
   ↓
GROWING
   ↓
HARVEST_READY
   ↓
HARVESTED
```

Only one-step-forward transitions are allowed.

Skipping stages, moving backward, or keeping the same stage is rejected.

### Harvest Management

- Record a harvest only when the batch is `HARVEST_READY`
- Validate harvest date, weight, and grade
- Require a positive harvest weight
- Automatically change the batch stage to `HARVESTED`
- Reject harvesting for missing, invalid, or non-ready batches
- Use PostgreSQL transactions for harvest operations
- Use row-level locking to prevent concurrent harvest inconsistencies

### Yield Reporting

- Generate a crop-wise yield report
- Group harvested weight by crop and grade
- Calculate total harvested weight in grams
- Return structured report data through a REST endpoint

Example:

```text
crop       grade    total_weight_grams
--------------------------------------
Bok Choy   A        600
Kale       A        750
Lettuce    A        500
```

---

## API Endpoints

### Trays

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trays` | Create a tray |
| GET | `/trays` | List all trays |
| GET | `/trays/:id` | Retrieve a tray by ID |

### Batches

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/batches` | Create a crop batch |
| GET | `/batches` | List batches with pagination/filtering |
| GET | `/batches/:id` | Retrieve a batch by ID |
| PATCH | `/batches/:id/stage` | Update batch stage |

### Harvests and Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/batches/:id/harvest` | Record a harvest |
| GET | `/reports/yield` | Generate crop-wise yield report |

---

## Example API Requests

### Create Tray

```http
POST /trays
Content-Type: application/json
```

```json
{
  "code": "T-A-014",
  "zone": "A",
  "capacity_units": 100
}
```

### Create Batch

```http
POST /batches
Content-Type: application/json
```

```json
{
  "tray_id": 1,
  "crop": "Lettuce",
  "seeded_on": "2026-09-23",
  "stage": "SEEDED",
  "expected_harvest_on": "2026-10-15"
}
```

### Update Batch Stage

```http
PATCH /batches/1/stage
Content-Type: application/json
```

```json
{
  "stage": "GERMINATION"
}
```

The API validates that the requested stage is the next valid stage in the lifecycle.

### Record Harvest

```http
POST /batches/1/harvest
Content-Type: application/json
```

```json
{
  "harvested_on": "2026-10-15",
  "weight_grams": 500,
  "grade": "A"
}
```

A harvest is accepted only when the batch is currently in the `HARVEST_READY` stage.

After successful harvest creation, the batch is automatically moved to:

```text
HARVESTED
```

### Yield Report

```http
GET /reports/yield
```

Example response:

```json
[
  {
    "crop": "Bok Choy",
    "grade": "A",
    "total_weight_grams": 600
  },
  {
    "crop": "Kale",
    "grade": "A",
    "total_weight_grams": 750
  },
  {
    "crop": "Lettuce",
    "grade": "A",
    "total_weight_grams": 500
  }
]
```

---

## Database Design

The application uses PostgreSQL for persistent storage.

Main entities include:

```text
TRAYS
  │
  └── BATCHES
        │
        └── HARVESTS
```

### Trays

Stores tray information such as:

- Tray ID
- Tray code
- Zone
- Capacity

### Batches

Stores crop batch information such as:

- Batch ID
- Tray ID
- Crop
- Seeded date
- Current stage
- Expected harvest date

### Harvests

Stores harvest information such as:

- Harvest ID
- Batch ID
- Harvest date
- Harvest weight
- Grade

Foreign-key relationships maintain consistency between trays, batches, and harvest records.

---

## Transaction Handling

Harvest creation uses a PostgreSQL transaction.

The workflow is:

```text
BEGIN
  ↓
Lock batch row
  ↓
Verify batch exists
  ↓
Verify HARVEST_READY
  ↓
Insert harvest
  ↓
Update batch → HARVESTED
  ↓
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

This ensures that a harvest record is not created while the corresponding batch remains in an inconsistent state.

Row-level locking is used when checking the batch before creating the harvest, helping prevent concurrent operations from harvesting the same batch incorrectly.

---

## Application Architecture

The project follows a layered backend structure:

```text
HTTP Request
     ↓
Routes
     ↓
Services
     ↓
PostgreSQL
     ↓
HTTP Response
```

### Routes

Responsible for:

- Receiving HTTP requests
- Validating request parameters
- Returning HTTP responses
- Mapping service errors to appropriate status codes

### Services

Responsible for:

- Business rules
- Stage transition validation
- Harvest logic
- Database operations
- Transaction handling

### Database

PostgreSQL provides:

- Persistent storage
- Relational data modelling
- Foreign-key relationships
- Transactions
- Row-level locking during harvest operations

---

## Project Structure

```text
arl-intern-assignment/
│
├── src/
│   ├── db.ts
│   ├── server.ts
│   │
│   ├── routes/
│   │   ├── batchRoutes.ts
│   │   ├── harvestRoutes.ts
│   │   └── trayRoutes.ts
│   │
│   ├── services/
│   │   ├── harvestService.ts
│   │   ├── pgBatchService.ts
│   │   ├── pgTrayService.ts
│   │   └── stageService.ts
│   │
│   └── types/
│       └── index.ts
│
├── tests/
│   ├── api.test.ts
│   ├── harvestService.test.ts
│   └── stageService.test.ts
│
├── schema.sql
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

---

## Automated Testing

The project uses **Vitest** for automated testing.

Test coverage includes:

- Tray API operations
- Batch API operations
- Batch stage transitions
- Harvest business rules
- Harvest validation
- Invalid request handling
- Yield reporting

Run the complete test suite with:

```bash
npm test
```

Example result:

```text
Test Files  3 passed
Tests       27 passed
```

---

## Build

Compile the TypeScript project using:

```bash
npm run build
```

The project should compile successfully without TypeScript errors.

---

## Development

Install dependencies:

```bash
npm install
```

Create your environment file:

```powershell
copy .env.example .env
```

Configure the PostgreSQL connection values in `.env`.

Start the development server:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

### Health Check

```http
GET /
```

Example response:

```json
{
  "message": "AgResearch Labs API is running"
}
```

---

## Environment Variables

The application uses environment variables for database configuration.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/agresearch
PORT=3000
```

Do not commit the actual `.env` file or database credentials to Git.

---

## Example Workflow

A typical crop lifecycle is:

```text
1. Create a tray
        ↓
2. Create a crop batch
        ↓
3. SEEDED
        ↓
4. GERMINATION
        ↓
5. GROWING
        ↓
6. HARVEST_READY
        ↓
7. Record harvest
        ↓
8. HARVESTED
        ↓
9. Generate yield report
```

The backend prevents invalid lifecycle operations through service-level validation.

---

## Error Handling

The API returns appropriate HTTP status codes for common failures.

Examples include:

### 400 Bad Request

Used for invalid or missing request data.

### 404 Not Found

Used when the requested tray or batch does not exist.

### 409 Conflict

Used when a business rule prevents the requested operation, such as attempting to harvest a batch that is not `HARVEST_READY`.

---

## Engineering Concepts Demonstrated

This project focuses on backend engineering concepts including:

- REST API design
- TypeScript type safety
- Layered architecture
- Service-oriented business logic
- PostgreSQL relational modelling
- Foreign-key relationships
- Database transactions
- Row-level locking
- Input validation
- State-machine style workflow validation
- Pagination and filtering
- Error handling
- Automated testing
- Separation of routes and business logic

---

## Author

Developed as part of the **AgResearch Labs Software Developer Intern Take-Home Assignment**.