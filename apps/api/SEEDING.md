# Database Seeding Setup Guide

## Overview
This script populates your database with test data including:
- ✅ 3 Divisions + 6 Departments
- ✅ 6 Test Users with different roles (admin, CFO, CSP, etc.)
- ✅ 3 RKAP Cycles (2025, 2026, 2027) with valid UUIDs
- ✅ Chart of Accounts (Revenue & Expense)
- ✅ Macro Assumptions & Cycle Versions
- ✅ Approval Workflows

## Prerequisites
1. **Database Running**: PostgreSQL must be running on your system
2. **Environment Variables**: Create a `.env` file in the `apps/api/` directory with:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=corplan_rkap
   ```

## How to Run

### Option 1: Using NPM (Development)
```bash
cd apps/api
npm run seed
```

### Option 2: Using NPM (Production - after build)
```bash
cd apps/api
npm run build
npm run seed:prod
```

### Option 3: Direct with Turbo (from project root)
```bash
turbo run seed --filter=api
```

## What Gets Created

### Test Users (login credentials in output)
- Super Admin: admin@corplan.com
- CFO: cfo@corplan.com
- CSP: csp@corplan.com
- Division Head: divisional.head@corplan.com
- Budget Owner: budget.owner@corplan.com
- Viewer: viewer@corplan.com

### RKAP Cycles
- **2027 (Draft)**: Use this to test budget entry forms
- **2026 (Active)**: Use this to test active projections
- **2025 (Locked)**: Use this to test locked cycle behavior

### Departments
- Operations Division
  - IT Department
  - Human Resources
- Sales Division
  - Regional Sales
  - Enterprise Sales
- Finance Division
  - Finance Department
  - Accounting Department

## Troubleshooting

### ❌ "Cannot connect to database"
- Ensure PostgreSQL is running: `psql --version`
- Check connection settings in `.env`
- Test connection: `psql -U postgres -d corplan_rkap`

### ❌ "TRUNCATE failed: relation does not exist"
- The database tables haven't been created yet
- Run the API first: `npm run start:dev` (it auto-syncs schema)
- Then run the seed

### ❌ "Permission denied"
- Check PostgreSQL user has permissions
- Run as superuser: `psql -U postgres`

## Next Steps
1. ✅ Run the seed script
2. 📱 Start the API: `npm run start:dev`
3. 🌐 Start the web app: `cd apps/web && npm run dev`
4. 🔐 Login with any test user credentials
5. 📊 Try creating/updating budget items

## Clean Slate
If you need to reseed the database:
```bash
npm run seed
```
The script automatically truncates existing data before reseeding.
