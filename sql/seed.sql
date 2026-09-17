-- Canonical fresh-install seed for the KSB Tracker.
--
-- This file is destructive: it drops and recreates every application table,
-- then inserts the KSB catalogue, AC catalogue, and AC/KSB relationships.
-- It includes the full Task → Evidence → AC/KSB schema. Use it only for a
-- new or disposable database, including the isolated E2E test database.

BEGIN;

-- ============================================================
-- 1. CLEAN UP
-- ============================================================

DROP TABLE IF EXISTS evidence_acceptance_criteria CASCADE;
DROP TABLE IF EXISTS evidence_ksbs CASCADE;
DROP TABLE IF EXISTS acceptance_criteria_ksbs CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS acceptance_criteria CASCADE;
DROP TABLE IF EXISTS ksbs CASCADE;


-- ============================================================
-- 2. KSBs
-- ============================================================

CREATE TABLE ksbs (
    id BIGSERIAL PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('Knowledge', 'Skill', 'Behaviour')),

    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. ACCEPTANCE CRITERIA
-- ============================================================

CREATE TABLE acceptance_criteria (
    id BIGSERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE,

    description TEXT NOT NULL,

    level VARCHAR(20) NOT NULL DEFAULT 'Pass'
        CHECK (level IN ('Pass', 'Distinction')),

    -- Words/phrases which help the AI assess the requirement.
    keywords TEXT[] NOT NULL DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. AC <-> KSB MANY-TO-MANY RELATIONSHIP
-- ============================================================

CREATE TABLE acceptance_criteria_ksbs (
    acceptance_criteria_id BIGINT NOT NULL
        REFERENCES acceptance_criteria(id)
        ON DELETE CASCADE,

    ksb_id BIGINT NOT NULL
        REFERENCES ksbs(id)
        ON DELETE CASCADE,

    PRIMARY KEY (acceptance_criteria_id, ksb_id)
);


-- ============================================================
-- 5. EVIDENCE
-- ============================================================
--
-- This is where your actual work goes.
--
-- Example:
--
-- Situation:
-- "The business team needed..."
--
-- Task:
-- "I needed to..."
--
-- Action:
-- "I created..."
--
-- Result:
-- "The stakeholders..."
--
-- The AI can later populate the suggested KSB/AC relationships.
-- ============================================================

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    raw_notes TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'ready_for_review', 'completed', 'archived')),

    -- Completion is always a user decision, never an AI decision.
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE evidence (
    id BIGSERIAL PRIMARY KEY,

    task_id BIGINT
        REFERENCES tasks(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    situation TEXT,
    task TEXT,
    action TEXT,
    result TEXT,

    -- Original rough notes before AI organisation
    raw_notes TEXT,

    -- Optional AI-generated STAR response
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,

    -- Whether the user has reviewed/approved the AI suggestions
    user_reviewed BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'ai_generated', 'awaiting_review', 'approved')),

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. EVIDENCE <-> KSB
-- ============================================================

CREATE TABLE evidence_ksbs (
    evidence_id BIGINT NOT NULL
        REFERENCES evidence(id)
        ON DELETE CASCADE,

    ksb_id BIGINT NOT NULL
        REFERENCES ksbs(id)
        ON DELETE CASCADE,

    -- AI confidence, e.g. 0.87 = 87%
    ai_confidence NUMERIC(5,4),

    -- Whether user has confirmed this relationship
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,

    review_status VARCHAR(20) NOT NULL DEFAULT 'suggested'
        CHECK (review_status IN ('suggested', 'accepted', 'rejected')),

    suggested_by VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (suggested_by IN ('ai', 'user')),

    reviewed_at TIMESTAMPTZ,

    PRIMARY KEY (evidence_id, ksb_id)
);


-- ============================================================
-- 7. EVIDENCE <-> AC
-- ============================================================

CREATE TABLE evidence_acceptance_criteria (
    evidence_id BIGINT NOT NULL
        REFERENCES evidence(id)
        ON DELETE CASCADE,

    acceptance_criteria_id BIGINT NOT NULL
        REFERENCES acceptance_criteria(id)
        ON DELETE CASCADE,

    ai_confidence NUMERIC(5,4),

    confirmed BOOLEAN NOT NULL DEFAULT FALSE,

    review_status VARCHAR(20) NOT NULL DEFAULT 'suggested'
        CHECK (review_status IN ('suggested', 'accepted', 'rejected')),

    suggested_by VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (suggested_by IN ('ai', 'user')),

    -- An AI may recommend that an AC is met; the user still decides whether
    -- the task itself is complete.
    ai_suggests_complete BOOLEAN NOT NULL DEFAULT FALSE,
    ai_completion_rationale TEXT,

    reviewed_at TIMESTAMPTZ,

    PRIMARY KEY (evidence_id, acceptance_criteria_id)
);


-- ============================================================
-- 8. NOTES
-- ============================================================
--
-- Completely separate from evidence.
--
-- Useful for:
--   - random thoughts
--   - things to investigate
--   - possible evidence
--   - mentor notes
--   - ideas
-- ============================================================

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255),

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. INDEXES
-- ============================================================

CREATE INDEX idx_ksbs_code
    ON ksbs(code);

CREATE INDEX idx_ksbs_type
    ON ksbs(type);

CREATE INDEX idx_ac_level
    ON acceptance_criteria(level);

CREATE INDEX idx_ac_ksb_ksb
    ON acceptance_criteria_ksbs(ksb_id);

CREATE INDEX idx_evidence_ksb
    ON evidence_ksbs(ksb_id);

CREATE INDEX idx_evidence_ac
    ON evidence_acceptance_criteria(acceptance_criteria_id);

CREATE INDEX idx_evidence_created
    ON evidence(created_at DESC);

CREATE INDEX idx_evidence_task
    ON evidence(task_id);

CREATE INDEX idx_tasks_created
    ON tasks(created_at DESC);

CREATE INDEX idx_notes_created
    ON notes(created_at DESC);


-- ============================================================
-- 10. INSERT KSBs
-- ============================================================

INSERT INTO ksbs (code, type, description) VALUES

-- Knowledge
('K1', 'Knowledge',
 'All stages of the software development life-cycle (what each stage contains, including the inputs and outputs).'),

('K3', 'Knowledge',
 'The roles and responsibilities of the project life-cycle within your organisation, and your role.'),

('K4', 'Knowledge',
 'How best to communicate using the different communication methods and how to adapt appropriately to different audiences.'),

('K5', 'Knowledge',
 'The similarities and differences between different software development methodologies, such as agile and waterfall.'),

('K7', 'Knowledge',
 'Software design approaches and patterns, to identify reusable solutions to commonly occurring problems.'),

('K8', 'Knowledge',
 'Organisational policies and procedures relating to the tasks being undertaken, and when to follow them. For example the storage and treatment of GDPR sensitive data.'),

('K10', 'Knowledge',
 'Principles and uses of relational and non-relational databases.'),

('K12', 'Knowledge',
 'Software testing frameworks and methodologies.'),


-- Skills
('S2', 'Skill',
 'Develop effective user interfaces.'),

('S3', 'Skill',
 'Link code to data sets.'),

('S5', 'Skill',
 'Conduct a range of test types, such as Integration, System, User Acceptance, Non-Functional, Performance and Security testing.'),

('S8', 'Skill',
 'Create simple software designs to effectively communicate understanding of the program.'),

('S9', 'Skill',
 'Create analysis artefacts, such as use cases and/or user stories.'),

('S13', 'Skill',
 'Follow testing frameworks and methodologies.'),

('S14', 'Skill',
 'Follow company, team or client approaches to continuous integration, version and source control.'),

('S15', 'Skill',
 'Communicate software solutions and ideas to technical and non-technical stakeholders.'),

('S17', 'Skill',
 'Interpret and implement a given design whilst remaining compliant with security and maintainability requirements.'),


-- Behaviours
('B1', 'Behaviour',
 'Works independently and takes responsibility. For example, has a disciplined and responsible approach to risk and stays motivated and committed when facing challenges.'),

('B4', 'Behaviour',
 'Works collaboratively with a wide range of people in different roles, internally and externally, with a positive attitude to inclusion & diversity.'),

('B5', 'Behaviour',
 'Acts with integrity with respect to ethical, legal and regulatory ensuring the protection of personal data, safety and security.'),

('B6', 'Behaviour',
 'Shows initiative and takes responsibility for solving problems within their own remit, being resourceful when faced with a problem to solve.'),

('B7', 'Behaviour',
 'Communicates effectively in a variety of situations to both a technical and non-technical audience.'),

('B8', 'Behaviour',
 'Shows curiosity to the business context in which the solution will be used, displaying an inquisitive approach to solving the problem. This includes the curiosity to explore new opportunities, techniques and the tenacity to improve methods and maximise performance of the solution and creativity in their approach to solutions.'),

('B9', 'Behaviour',
 'Committed to continued professional development.');


-- ============================================================
-- 11. INSERT ACCEPTANCE CRITERIA
-- ============================================================

INSERT INTO acceptance_criteria
    (code, description, level, keywords)
VALUES

(
    'AC01',
    'Describes all stages of the software development lifecycle.',
    'Pass',
    ARRAY['describes', 'software development lifecycle', 'SDLC', 'stages']
),

(
    'AC02',
    'Describes the roles and responsibilities of the project lifecycle within their organisation, and their role.',
    'Pass',
    ARRAY['describes', 'roles', 'responsibilities', 'project lifecycle', 'organisation', 'role']
),

(
    'AC03',
    'Describes methods of communicating with all stakeholders that is determined by the audience and/or their level of technical knowledge.',
    'Pass',
    ARRAY['describes', 'communicating', 'stakeholders', 'audience', 'technical knowledge', 'adapt']
),

(
    'AC04',
    'Describes the similarities and differences between different software development methodologies, such as agile and waterfall.',
    'Pass',
    ARRAY['describes', 'similarities', 'differences', 'agile', 'waterfall', 'methodologies']
),

(
    'AC05',
    'Suggests and applies different software design approaches and patterns, to identify reusable solutions to commonly occurring problems (include Bespoke or off-the-shelf).',
    'Pass',
    ARRAY['suggests', 'applies', 'design approaches', 'patterns', 'reusable', 'bespoke', 'off-the-shelf']
),

(
    'AC06',
    'Explains the relevance of organisational policies and procedures relating to the tasks undertaken, and when to follow them including how they have followed company, team or client approaches to continuous integration, version, and source control.',
    'Pass',
    ARRAY['explains', 'organisational policies', 'procedures', 'continuous integration', 'version control', 'source control']
),

(
    'AC07',
    'Applies the principles and uses of relational and non-relational databases to software development tasks.',
    'Pass',
    ARRAY['applies', 'relational', 'non-relational', 'database', 'databases']
),

(
    'AC08',
    'Describes basic software testing frameworks and methodologies.',
    'Pass',
    ARRAY['describes', 'testing frameworks', 'testing methodologies']
),

(
    'AC09',
    'Explains their own approach to development of user interfaces.',
    'Pass',
    ARRAY['explains', 'approach', 'development', 'user interfaces', 'UI']
),

(
    'AC10',
    'Explains how they have linked code to data sets.',
    'Pass',
    ARRAY['explains', 'linked', 'code', 'data sets', 'data']
),

(
    'AC11',
    'Illustrates how to conduct test types, including Integration, System, User Acceptance, Non-Functional, Performance and Security testing including how they have followed testing frameworks and methodologies.',
    'Pass',
    ARRAY['illustrates', 'integration', 'system', 'user acceptance', 'non-functional', 'performance', 'security', 'testing frameworks', 'methodologies']
),

(
    'AC12',
    'Creates simple software designs to communicate understanding of the programme to stakeholders and users of the programme.',
    'Pass',
    ARRAY['creates', 'software designs', 'communicate', 'stakeholders', 'users']
),

(
    'AC13',
    'Creates analysis artefacts, such as use cases and/or user stories to enable effective delivery of software activities.',
    'Pass',
    ARRAY['creates', 'analysis artefacts', 'use cases', 'user stories']
),

(
    'AC14',
    'Explains how they have interpreted and implemented a given design whilst remaining compliant with security and maintainability requirements.',
    'Pass',
    ARRAY['explains', 'interpreted', 'implemented', 'design', 'security', 'maintainability']
),

(
    'AC15',
    'Describes how they have operated independently to complete tasks to given deadlines which reflect the level of responsibility assigned to them by the organisation.',
    'Pass',
    ARRAY['describes', 'independently', 'deadlines', 'responsibility', 'organisation']
),

(
    'AC16',
    'Illustrates how they have worked collaboratively with people in different roles, internally and externally, which show a positive attitude to inclusion & diversity.',
    'Pass',
    ARRAY['illustrates', 'collaboratively', 'different roles', 'internally', 'externally', 'inclusion', 'diversity']
),

(
    'AC17',
    'Explains how they have established an approach in the workplace which reflects integrity with respect to ethical, legal, and regulatory matters and ensures the protection of personal data, safety and security.',
    'Pass',
    ARRAY['explains', 'integrity', 'ethical', 'legal', 'regulatory', 'personal data', 'safety', 'security']
),

(
    'AC18',
    'Illustrates their approach to meeting unexpected minor changes at work and outlines their approach to delivering within their remit using their initiative.',
    'Pass',
    ARRAY['illustrates', 'unexpected changes', 'initiative', 'remit', 'problem solving']
),

(
    'AC19',
    'Explains how they have communicated effectively in a variety of situations to both a technical and non-technical audience.',
    'Pass',
    ARRAY['explains', 'communicated', 'technical', 'non-technical', 'audience', 'communication']
),

(
    'AC20',
    'Illustrates how they have responded to the business context with curiosity to explore new opportunities and techniques with tenacity to improve solution performance, establishing an approach to methods and solutions which reflects a determination to succeed.',
    'Pass',
    ARRAY['illustrates', 'business context', 'curiosity', 'opportunities', 'techniques', 'tenacity', 'performance', 'determination']
),

(
    'AC21',
    'Explains how they reflect on their continued professional development and act independently to seek out new opportunities.',
    'Pass',
    ARRAY['explains', 'professional development', 'CPD', 'independently', 'opportunities']
),


-- ==========================================================
-- DISTINCTION CRITERIA
-- ==========================================================

(
    'D01',
    'Compares and contrasts the different types of communication used for technical and non-technical audiences and the benefits of these types of communication methods.',
    'Distinction',
    ARRAY['compares', 'contrasts', 'communication', 'technical', 'non-technical', 'benefits']
),

(
    'D02',
    'Evaluates and recommends approaches to using reusable solutions to common problems.',
    'Distinction',
    ARRAY['evaluates', 'recommends', 'reusable solutions', 'common problems']
),

(
    'D03',
    'Evaluates the use of various software testing frameworks and methodologies and justifies their choice.',
    'Distinction',
    ARRAY['evaluates', 'testing frameworks', 'testing methodologies', 'justifies', 'choice']
);


-- ============================================================
-- 12. LINK ACs TO KSBs
-- ============================================================

-- AC01 -> K1
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC01'
  AND k.code = 'K1';


-- AC02 -> K3
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC02'
  AND k.code = 'K3';


-- AC03 -> K4 + S15
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC03'
  AND k.code IN ('K4', 'S15');


-- AC04 -> K5
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC04'
  AND k.code = 'K5';


-- AC05 -> K7
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC05'
  AND k.code = 'K7';


-- AC06 -> K8 + S14
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC06'
  AND k.code IN ('K8', 'S14');


-- AC07 -> K10
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC07'
  AND k.code = 'K10';


-- AC08 -> K12
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC08'
  AND k.code = 'K12';


-- AC09 -> S2
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC09'
  AND k.code = 'S2';


-- AC10 -> S3
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC10'
  AND k.code = 'S3';


-- AC11 -> S5 + S13
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC11'
  AND k.code IN ('S5', 'S13');


-- AC12 -> S8
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC12'
  AND k.code = 'S8';


-- AC13 -> S9
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC13'
  AND k.code = 'S9';


-- AC14 -> S17
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC14'
  AND k.code = 'S17';


-- AC15 -> B1
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC15'
  AND k.code = 'B1';


-- AC16 -> B4
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC16'
  AND k.code = 'B4';


-- AC17 -> B5
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC17'
  AND k.code = 'B5';


-- AC18 -> B6
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC18'
  AND k.code = 'B6';


-- AC19 -> B7
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC19'
  AND k.code = 'B7';


-- AC20 -> B8
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC20'
  AND k.code = 'B8';


-- AC21 -> B9
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'AC21'
  AND k.code = 'B9';


-- ==========================================================
-- DISTINCTION
-- ==========================================================


-- D01 -> K4 + S15 + B7
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'D01'
  AND k.code IN ('K4', 'S15', 'B7');


-- D02 -> K7
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'D02'
  AND k.code = 'K7';


-- D03 -> K12
INSERT INTO acceptance_criteria_ksbs
SELECT ac.id, k.id
FROM acceptance_criteria ac, ksbs k
WHERE ac.code = 'D03'
  AND k.code = 'K12';


-- ============================================================
-- 13. UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 14. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_ksbs_updated_at
BEFORE UPDATE ON ksbs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_acceptance_criteria_updated_at
BEFORE UPDATE ON acceptance_criteria
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_evidence_updated_at
BEFORE UPDATE ON evidence
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 15. VERIFICATION
-- ============================================================

SELECT
    'KSBs' AS table_name,
    COUNT(*) AS count
FROM ksbs

UNION ALL

SELECT
    'Acceptance Criteria',
    COUNT(*)
FROM acceptance_criteria

UNION ALL

SELECT
    'AC/KSB relationships',
    COUNT(*)
FROM acceptance_criteria_ksbs;


-- ============================================================
-- 16. SHOW AC -> KSB RELATIONSHIPS
-- ============================================================

SELECT
    ac.code AS ac,
    ac.level,
    ac.description,
    STRING_AGG(k.code, ', ' ORDER BY k.code) AS ksbs
FROM acceptance_criteria ac
JOIN acceptance_criteria_ksbs ack
    ON ack.acceptance_criteria_id = ac.id
JOIN ksbs k
    ON k.id = ack.ksb_id
GROUP BY
    ac.id,
    ac.code,
    ac.level,
    ac.description
ORDER BY
    ac.id;

COMMIT;
