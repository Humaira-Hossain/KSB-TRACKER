# End-to-end testing

The Playwright tests use a real frontend, Express API, and PostgreSQL database. They create test tasks, so they must run against an isolated database.

1. Create a separate Supabase test project/database.
2. Apply the schema and seed data to that database:

   ```sh
   psql "$E2E_DATABASE_URL" -f sql/seed.sql
   ```

3. Copy the template and add the real connection string once:

   ```sh
   cd client
   cp .env.e2e.example .env.e2e
   ```

   In `.env.e2e`, replace the placeholder with credentials for the separate test database:

   ```env
   E2E_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_TEST_PROJECT.supabase.co:5432/postgres?sslmode=require
   ```

   Then run:

   ```sh
   npm run test:e2e
   ```

   In Supabase, copy the PostgreSQL connection string from the **Connect** panel of a separate test project. Do not use the connection string from the database that contains your real apprenticeship evidence.

   `.env.e2e` is ignored by Git. You can still override it temporarily with an `E2E_DATABASE_URL` environment variable if needed.

For interactive debugging, run `npm run test:e2e:ui` instead.

Playwright starts the Express server on port 5001 and Vite on port 5173. It will not run unless `E2E_DATABASE_URL` is set.

On this corporate network, install Playwright browsers with:

```sh
node --use-system-ca node_modules/playwright/cli.js install chromium
```
