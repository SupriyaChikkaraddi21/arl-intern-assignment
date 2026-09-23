# AgResearch Labs API

A TypeScript REST API for managing agricultural trays, crop batches, growth stages, harvest records, and yield reports.

## Tech Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- pg
- Vitest
- dotenv

## Features

- Create and list trays
- Retrieve trays by ID
- Create crop batches
- List and retrieve batches
- Validate batch stage transitions
- Record harvests only when a batch is HARVEST_READY
- Automatically mark harvested batches as HARVESTED
- Generate crop-wise yield reports grouped by grade
- PostgreSQL transactions for harvest operations
- Automated API and service tests

## Project Structure

```text
arl-intern-assignment/
├── src/
│   ├── db.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── batchRoutes.ts
│   │   ├── harvestRoutes.ts
│   │   └── trayRoutes.ts
│   ├── services/
│   │   ├── harvestService.ts
│   │   ├── pgBatchService.ts
│   │   ├── pgTrayService.ts
│   │   └── stageService.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── api.test.ts
│   ├── harvestService.test.ts
│   └── stageService.test.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json