-- Run once against the existing Supabase database. This migration is additive
-- and does not delete seeded KSBs, ACs, or existing evidence.

BEGIN;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    raw_notes TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'ready_for_review', 'completed', 'archived')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS task_id BIGINT
        REFERENCES tasks(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'ai_generated', 'awaiting_review', 'approved')),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE evidence_ksbs
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'suggested'
        CHECK (review_status IN ('suggested', 'accepted', 'rejected')),
    ADD COLUMN IF NOT EXISTS suggested_by VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (suggested_by IN ('ai', 'user')),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE evidence_acceptance_criteria
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'suggested'
        CHECK (review_status IN ('suggested', 'accepted', 'rejected')),
    ADD COLUMN IF NOT EXISTS suggested_by VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (suggested_by IN ('ai', 'user')),
    ADD COLUMN IF NOT EXISTS ai_suggests_complete BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_completion_rationale TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

UPDATE evidence_ksbs
SET review_status = 'accepted', reviewed_at = NOW()
WHERE confirmed = TRUE AND review_status = 'suggested';

UPDATE evidence_acceptance_criteria
SET review_status = 'accepted', reviewed_at = NOW()
WHERE confirmed = TRUE AND review_status = 'suggested';

CREATE INDEX IF NOT EXISTS idx_evidence_task ON evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

-- Replace only the CHECK constraint that governs tasks.status. Looking up its
-- actual name makes this safe if PostgreSQL generated a different name.
DO $$
DECLARE
    status_constraint_name TEXT;
BEGIN
    SELECT conname INTO status_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
    LIMIT 1;

    IF status_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tasks DROP CONSTRAINT %I', status_constraint_name);
    END IF;
END;
$$;

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('draft', 'ready_for_review', 'completed', 'archived'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
