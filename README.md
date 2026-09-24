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

SEEDED
   ↓
GERMINATION
   ↓
GROWING
   ↓
HARVEST_READY
   ↓
HARVESTED

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

- Generate yield reports grouped by crop or zone
- Filter harvested records using a date range
- Calculate total harvested weight in grams
- Count the number of harvested batches
- Calculate average days from seeding to harvest
- Return structured report data through a REST endpoint

Example:

    crop       grade    total_weight_grams
    --------------------------------------
    Bok Choy   A        600
    Kale       A        750
    Lettuce    A        500

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

    POST /trays
    Content-Type: application/json

    {
      "code": "T-A-014",
      "zone": "A",
      "capacity_units": 100
    }

### Create Batch

    POST /batches
    Content-Type: application/json

    {
      "tray_id": 1,
      "crop": "Lettuce",
      "seeded_on": "2026-09-23",
      "stage": "SEEDED",
      "expected_harvest_on": "2026-10-15"
    }

### Update Batch Stage

    PATCH /batches/1/stage
    Content-Type: application/json

    {
      "stage": "GERMINATION"
    }

The API validates that the requested stage is the next valid stage in the lifecycle.

### Record Harvest

    POST /batches/1/harvest
    Content-Type: application/json

    {
      "harvested_on": "2026-10-15",
      "weight_grams": 500,
      "grade": "A"
    }

A harvest is accepted only when the batch is currently in the `HARVEST_READY` stage.

After successful harvest creation, the batch is automatically moved to:

`HARVESTED`

### Yield Report

    GET /reports/yield

Example response:

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

---

## Database Design

The application uses PostgreSQL for persistent storage.

Main entities include:

    TRAYS
      │
      └── BATCHES
            │
            └── HARVESTS

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

If any operation fails:

    ROLLBACK

This ensures that a harvest record is not created while the corresponding batch remains in an inconsistent state.

Row-level locking is used when checking the batch before creating the harvest, helping prevent concurrent operations from harvesting the same batch incorrectly.

---

## Application Architecture

The project follows a layered backend structure:

    HTTP Request
         ↓
       Routes
         ↓
      Services
         ↓
     PostgreSQL
         ↓
    HTTP Response

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

    npm test

Example result:

    Test Files  3 passed
    Tests       27 passed

---

## Build

Compile the TypeScript project using:

    npm run build

The project should compile successfully without TypeScript errors.

---

## Development

Install dependencies:

    npm install

Create your environment file:

    copy .env.example .env

Configure the PostgreSQL connection values in `.env`.

Start the development server:

    npm run dev

The API runs on:

    http://localhost:3000

### Health Check

    GET /

Example response:

    {
      "message": "AgResearch Labs API is running"
    }

---

## Environment Variables

The application uses environment variables for database configuration.

Example:

    DATABASE_URL=postgresql://username:password@localhost:5432/agresearch
    PORT=3000

Do not commit the actual `.env` file or database credentials to Git.

---

## Example Workflow

A typical crop lifecycle is:

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

The backend prevents invalid lifecycle operations through service-level validation.

---

## Error Handling

The API returns appropriate HTTP status codes for common failures.

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

## Assumptions

The following assumptions were made where the assignment specification did not explicitly define the behaviour:

### Batch Lifecycle

- Every newly created batch starts in the `SEEDED` stage.
- A batch is considered active until it reaches `HARVESTED`.
- A tray can have only one active batch at a time.
- Once a batch reaches `HARVESTED`, its tray can be reused for another batch.
- Batch stages must progress strictly in this order:
  `SEEDED → GERMINATION → GROWING → HARVEST_READY → HARVESTED`.
- Stage transitions are limited to exactly one step forward. Skipping stages, moving backward, or repeating the current stage is rejected.

### Validation

- Tray codes are treated as unique identifiers.
- Tray capacity must be a positive value.
- Required fields must be present and valid before data is persisted.
- Harvest weight must be greater than zero.
- Harvest grade is restricted to the grades defined by the assignment: `A`, `B`, or `C`.
- Invalid input is treated as a `400 Bad Request`.
- Requests for resources that do not exist are treated as `404 Not Found`.
- Requests that violate an existing business rule, such as attempting to create another active batch on an occupied tray, are treated as `409 Conflict`.

### Harvest Handling

- A harvest can only be recorded when the batch is currently in `HARVEST_READY`.
- Recording a harvest and changing the batch to `HARVESTED` are treated as one atomic database operation.
- If any part of the harvest transaction fails, the transaction is rolled back.
- Row-level locking is used during harvest processing so concurrent requests cannot incorrectly harvest the same batch.

### Pagination and Filtering

- Pagination is applied to batch listing when requested.
- Batch filtering can be combined using the supported stage, crop, and zone parameters.
- When pagination parameters are omitted, the API uses its configured default behaviour.

### Database and Architecture

- PostgreSQL is the source of truth for persisted application data.
- Business rules are primarily enforced in the service layer, with database constraints used where appropriate to protect data integrity.
- Routes are responsible for HTTP-level concerns, while services contain the core business logic and database operations.
- The API does not implement authentication because authentication is explicitly outside the scope of the assignment.

### Scope

- No frontend, authentication, Docker, CI/CD, or deployment infrastructure is required because these are outside the evaluation scope of the assignment.
- The implementation prioritizes correctness of the required REST API, database design, business rules, transactions, and automated tests.
- Part 3 is treated separately from the required Part 1 and Part 2 functionality.

## Part 3 — Yield Reporting (3c)

### Chosen Option

I chose **Part 3c: Yield Reporting** because it extends the existing harvest and batch data model into a useful reporting capability while demonstrating SQL aggregation, filtering, grouping, and date-based calculations.

The implementation provides:

`GET /reports/yield?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=crop`

or:

`GET /reports/yield?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=zone`

### Approach

The endpoint accepts:

- `from` — start date of the harvest reporting period
- `to` — end date of the harvest reporting period
- `group_by` — either `crop` or `zone`

For each group, the API returns:

- Total harvested weight in grams
- Number of harvested batches
- Average number of days from `seeded_on` to `harvested_on`

The reporting operation is performed using **one SQL query**. There is no loop that executes a separate database query for each group.

### SQL Query

The core query is:

```sql
SELECT
  <group_column> AS "group",
  SUM(h.weight_grams)::int AS total_harvested_weight_grams,
  COUNT(DISTINCT b.id)::int AS batches_harvested,
  ROUND(
    AVG(h.harvested_on - b.seeded_on),
    2
  ) AS average_days_to_harvest
FROM harvests h
JOIN batches b
  ON b.id = h.batch_id
JOIN trays t
  ON t.id = b.tray_id
WHERE h.harvested_on BETWEEN $1 AND $2
GROUP BY <group_column>
ORDER BY <group_column>;

```

## What I Would Do With More Time

All required functionality for Parts 1 and 2 was completed, and I implemented Part 3c (Yield Reporting).

I did not attempt Part 3a (Concurrency Safety) or Part 3b (Idempotent Harvest Recording) due to time constraints.

If I continued, I would first implement Part 3b by supporting an `Idempotency-Key` header for harvest requests and storing idempotency keys with a 24-hour validity period, since the stated use case involves retries from unreliable mobile connections. I would also add genuinely concurrent API tests for Part 3a and verify the behaviour when multiple API instances run behind a load balancer.

I would additionally expand integration and edge-case tests around date boundaries, pagination, reporting queries, and database constraints.

## AI Usage

I used ChatGPT during development for debugging assistance, understanding test failures, reviewing implementation approaches, and improving README documentation. I reviewed the suggestions and made sure I understood the implementation and decisions included in the final submission.

## Author

Developed as part of the **AgResearch Labs Software Developer Intern Take-Home Assignment**.

