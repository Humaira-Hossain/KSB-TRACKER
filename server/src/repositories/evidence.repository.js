import { pool } from "../db.js";

export function listEvidenceForTask(taskId) {
  return pool.query("SELECT * FROM evidence WHERE task_id = $1 ORDER BY created_at DESC", [taskId]);
}

export function getEvidence(id) {
  return pool.query("SELECT id FROM evidence WHERE id = $1", [id]);
}

export function getEvidenceForGeneration(id) {
  return pool.query("SELECT id, title, raw_notes FROM evidence WHERE id = $1", [id]);
}

export function createEvidence(taskId, evidence) {
  return pool.query("INSERT INTO evidence (task_id, title, situation, task, action, result, raw_notes, ai_generated, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *", [taskId, evidence.title, evidence.situation ?? null, evidence.task ?? null, evidence.action ?? null, evidence.result ?? null, evidence.rawNotes ?? null, evidence.aiGenerated ?? false, evidence.status]);
}

export function updateEvidence(id, updates) {
  const allowed = ["title", "situation", "task", "action", "result", "raw_notes", "ai_generated", "user_reviewed", "status", "reviewed_at"];
  const fields = allowed.filter((field) => Object.hasOwn(updates, field));
  if (!fields.length) return null;
  const values = fields.map((field) => updates[field]);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  values.push(id);
  return pool.query(`UPDATE evidence SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
}

export async function createKsbLink(evidenceId, ksbId, link) {
  return pool.query("INSERT INTO evidence_ksbs (evidence_id, ksb_id, ai_confidence, confirmed, review_status, suggested_by, reviewed_at) VALUES ($1, $2, $3, $4, $5::varchar, $6, CASE WHEN $5::varchar = 'suggested' THEN NULL ELSE NOW() END) ON CONFLICT (evidence_id, ksb_id) DO UPDATE SET ai_confidence = EXCLUDED.ai_confidence, confirmed = EXCLUDED.confirmed, review_status = EXCLUDED.review_status, suggested_by = EXCLUDED.suggested_by, reviewed_at = EXCLUDED.reviewed_at RETURNING *", [evidenceId, ksbId, link.aiConfidence, link.reviewStatus === "accepted", link.reviewStatus, link.suggestedBy]);
}

export async function createAcceptanceCriterionLink(evidenceId, acId, link) {
  return pool.query("INSERT INTO evidence_acceptance_criteria (evidence_id, acceptance_criteria_id, ai_confidence, confirmed, review_status, suggested_by, ai_suggests_complete, ai_completion_rationale, reviewed_at) VALUES ($1, $2, $3, $4, $5::varchar, $6, $7, $8, CASE WHEN $5::varchar = 'suggested' THEN NULL ELSE NOW() END) ON CONFLICT (evidence_id, acceptance_criteria_id) DO UPDATE SET ai_confidence = EXCLUDED.ai_confidence, confirmed = EXCLUDED.confirmed, review_status = EXCLUDED.review_status, suggested_by = EXCLUDED.suggested_by, ai_suggests_complete = EXCLUDED.ai_suggests_complete, ai_completion_rationale = EXCLUDED.ai_completion_rationale, reviewed_at = EXCLUDED.reviewed_at RETURNING *", [evidenceId, acId, link.aiConfidence, link.reviewStatus === "accepted", link.reviewStatus, link.suggestedBy, link.aiSuggestsComplete, link.aiCompletionRationale]);
}

export function reviewKsbLink(evidenceId, ksbId, reviewStatus) {
  return pool.query("UPDATE evidence_ksbs SET review_status = $1, confirmed = $2, reviewed_at = NOW() WHERE evidence_id = $3 AND ksb_id = $4 RETURNING *", [reviewStatus, reviewStatus === "accepted", evidenceId, ksbId]);
}

export function reviewAcceptanceCriterionLink(evidenceId, acId, reviewStatus) {
  return pool.query("UPDATE evidence_acceptance_criteria SET review_status = $1, confirmed = $2, reviewed_at = NOW() WHERE evidence_id = $3 AND acceptance_criteria_id = $4 RETURNING *", [reviewStatus, reviewStatus === "accepted", evidenceId, acId]);
}

// Keep an existing accepted/rejected user decision intact when evidence is
// regenerated. Only a pending AI suggestion may be refreshed.
export async function saveGeneratedEvidence(evidenceId, generated, suggestions) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const evidenceResult = await client.query("UPDATE evidence SET title = $1, situation = $2, task = $3, action = $4, result = $5, ai_generated = TRUE, user_reviewed = FALSE, status = 'awaiting_review', reviewed_at = NULL WHERE id = $6 RETURNING *", [generated.title, generated.situation, generated.task, generated.action, generated.result, evidenceId]);

    for (const suggestion of suggestions.ksbs) {
      await client.query("INSERT INTO evidence_ksbs (evidence_id, ksb_id, ai_confidence, confirmed, review_status, suggested_by, reviewed_at) VALUES ($1, $2, $3, FALSE, 'suggested', 'ai', NULL) ON CONFLICT (evidence_id, ksb_id) DO UPDATE SET ai_confidence = EXCLUDED.ai_confidence, confirmed = FALSE, review_status = 'suggested', suggested_by = 'ai', reviewed_at = NULL WHERE evidence_ksbs.review_status = 'suggested' AND evidence_ksbs.suggested_by = 'ai'", [evidenceId, suggestion.id, suggestion.confidence]);
    }

    for (const suggestion of suggestions.acceptanceCriteria) {
      await client.query("INSERT INTO evidence_acceptance_criteria (evidence_id, acceptance_criteria_id, ai_confidence, confirmed, review_status, suggested_by, ai_suggests_complete, ai_completion_rationale, reviewed_at) VALUES ($1, $2, $3, FALSE, 'suggested', 'ai', FALSE, NULL, NULL) ON CONFLICT (evidence_id, acceptance_criteria_id) DO UPDATE SET ai_confidence = EXCLUDED.ai_confidence, confirmed = FALSE, review_status = 'suggested', suggested_by = 'ai', ai_suggests_complete = FALSE, ai_completion_rationale = NULL, reviewed_at = NULL WHERE evidence_acceptance_criteria.review_status = 'suggested' AND evidence_acceptance_criteria.suggested_by = 'ai'", [evidenceId, suggestion.id, suggestion.confidence]);
    }

    await client.query("COMMIT");
    return evidenceResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
