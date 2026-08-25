import { pool } from '../db.js'

export async function listKsbs() {
  return pool.query(
    `SELECT k.id, k.code, k.type, k.description, COUNT(DISTINCT ack.acceptance_criteria_id)::int AS acceptance_criteria_count, COUNT(DISTINCT ek.evidence_id) FILTER (WHERE ek.review_status = 'accepted')::int AS evidenced_count FROM ksbs k LEFT JOIN acceptance_criteria_ksbs ack ON ack.ksb_id = k.id LEFT JOIN evidence_ksbs ek ON ek.ksb_id = k.id GROUP BY k.id ORDER BY k.code`,
  )
}

export async function getKsb(id) {
  return pool.query('SELECT * FROM ksbs WHERE id = $1', [id])
}

export async function getKsbDetails(id) {
  return Promise.all([
    pool.query(
      'SELECT ac.id, ac.code, ac.level, ac.description FROM acceptance_criteria ac JOIN acceptance_criteria_ksbs ack ON ack.acceptance_criteria_id = ac.id WHERE ack.ksb_id = $1 ORDER BY ac.code',
      [id],
    ),
    pool.query(
      'SELECT e.id, e.task_id, e.title, e.status, ek.review_status, ek.ai_confidence FROM evidence e JOIN evidence_ksbs ek ON ek.evidence_id = e.id WHERE ek.ksb_id = $1 ORDER BY e.created_at DESC',
      [id],
    ),
  ])
}

export async function listAcceptanceCriteria() {
  return pool.query(
    `SELECT ac.id, ac.code, ac.level, ac.description, ac.keywords, COALESCE(array_agg(k.code ORDER BY k.code) FILTER (WHERE k.id IS NOT NULL), '{}') AS ksb_codes FROM acceptance_criteria ac LEFT JOIN acceptance_criteria_ksbs ack ON ack.acceptance_criteria_id = ac.id LEFT JOIN ksbs k ON k.id = ack.ksb_id GROUP BY ac.id ORDER BY ac.code`,
  )
}

export async function getAcceptanceCriterion(id) {
  return pool.query('SELECT * FROM acceptance_criteria WHERE id = $1', [id])
}

export async function getAcceptanceCriterionDetails(id) {
  return Promise.all([
    pool.query(
      'SELECT k.id, k.code, k.type, k.description FROM ksbs k JOIN acceptance_criteria_ksbs ack ON ack.ksb_id = k.id WHERE ack.acceptance_criteria_id = $1 ORDER BY k.code',
      [id],
    ),
    pool.query(
      'SELECT e.id, e.task_id, e.title, e.status, eac.review_status, eac.ai_confidence, eac.ai_suggests_complete, eac.ai_completion_rationale FROM evidence e JOIN evidence_acceptance_criteria eac ON eac.evidence_id = e.id WHERE eac.acceptance_criteria_id = $1 ORDER BY e.created_at DESC',
      [id],
    ),
  ])
}

export function getAcceptanceCriterionEvidenceByCode(code) {
  return Promise.all([
    pool.query(
      'SELECT id, code, level, description, keywords FROM acceptance_criteria WHERE code = $1',
      [code],
    ),
    pool.query(
      'SELECT k.code FROM ksbs k JOIN acceptance_criteria_ksbs ack ON ack.ksb_id = k.id JOIN acceptance_criteria ac ON ac.id = ack.acceptance_criteria_id WHERE ac.code = $1 ORDER BY k.code',
      [code],
    ),
    pool.query(
      `
      SELECT e.id, e.title, e.status, e.raw_notes, e.situation, e.task, e.action, e.result,
             e.ai_generated, e.user_reviewed, e.created_at, e.updated_at,
             eac.review_status, eac.ai_confidence,
             CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object(
               'id', t.id::text, 'title', t.title, 'status', t.status,
               'rawNotes', t.raw_notes, 'completedAt', t.completed_at
             ) END AS task
      FROM evidence_acceptance_criteria eac
      JOIN acceptance_criteria ac ON ac.id = eac.acceptance_criteria_id
      JOIN evidence e ON e.id = eac.evidence_id
      LEFT JOIN tasks t ON t.id = e.task_id
      WHERE ac.code = $1
      ORDER BY e.created_at DESC
    `,
      [code],
    ),
  ])
}

export function getKsbEvidenceByCode(code) {
  return Promise.all([
    pool.query('SELECT id, code, type, description FROM ksbs WHERE code = $1', [code]),
    pool.query(
      `
      SELECT e.id, e.title, e.status, e.raw_notes, e.situation, e.task, e.action, e.result,
             e.ai_generated, e.user_reviewed, e.created_at, e.updated_at,
             ek.review_status, ek.ai_confidence,
             CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object(
               'id', t.id::text, 'title', t.title, 'status', t.status,
               'rawNotes', t.raw_notes, 'completedAt', t.completed_at
             ) END AS task
      FROM evidence_ksbs ek
      JOIN ksbs k ON k.id = ek.ksb_id
      JOIN evidence e ON e.id = ek.evidence_id
      LEFT JOIN tasks t ON t.id = e.task_id
      WHERE k.code = $1
      ORDER BY e.created_at DESC
    `,
      [code],
    ),
  ])
}

export function getGenerationCatalogue() {
  return Promise.all([
    pool.query('SELECT id, code, type, description FROM ksbs ORDER BY code'),
    pool.query(
      `SELECT ac.id, ac.code, ac.level, ac.description, ac.keywords, COALESCE(array_agg(k.code ORDER BY k.code) FILTER (WHERE k.id IS NOT NULL), '{}') AS required_ksb_codes FROM acceptance_criteria ac LEFT JOIN acceptance_criteria_ksbs ack ON ack.acceptance_criteria_id = ac.id LEFT JOIN ksbs k ON k.id = ack.ksb_id GROUP BY ac.id ORDER BY ac.code`,
    ),
  ])
}
