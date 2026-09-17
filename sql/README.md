# Database SQL

## Fresh database or E2E test database

Run [`seed.sql`](seed.sql). It is the canonical, complete schema and catalogue seed. It includes tasks, evidence, KSBs, acceptance criteria, evidence links, notes, indexes, and `updated_at` triggers.

It drops all application tables first, so never run it against a database containing evidence you want to keep.

```sh
psql "$DATABASE_URL" -f sql/seed.sql
```

## Existing database

Files in [`migrations/`](migrations/) are historical additive migrations. Apply a migration only once and only if your database has not already received it. Do not run the fresh seed after a migration unless you intentionally want to reset the database.
