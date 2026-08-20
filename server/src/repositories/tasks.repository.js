import { pool } from "../db.js";

export function listTasks() {
  return pool.query("SELECT t.*, COUNT(e.id)::int AS evidence_count FROM tasks t LEFT JOIN evidence e ON e.task_id = t.id GROUP BY t.id ORDER BY t.created_at DESC");
}

export function getTask(id) {
  return pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
}

export function getTaskWithEvidence(id) {
  return pool.query(`
    SELECT t.*,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', e.id::text, 'title', e.title, 'status', e.status,
          'rawNotes', e.raw_notes, 'situation', e.situation, 'task', e.task,
          'action', e.action, 'result', e.result, 'createdAt', e.created_at,
          'updatedAt', e.updated_at,
          'acceptanceCriteria', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', ac.id::text, 'code', ac.code, 'description', ac.description,
              'reviewStatus', eac.review_status
            ) ORDER BY ac.code)
            FROM evidence_acceptance_criteria eac
            JOIN acceptance_criteria ac ON ac.id = eac.acceptance_criteria_id
            WHERE eac.evidence_id = e.id
          ), '[]'::jsonb),
          'ksbs', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', k.id::text, 'code', k.code, 'type', k.type,
              'description', k.description, 'reviewStatus', ek.review_status
            ) ORDER BY k.code)
            FROM evidence_ksbs ek
            JOIN ksbs k ON k.id = ek.ksb_id
            WHERE ek.evidence_id = e.id
          ), '[]'::jsonb)
        ) ORDER BY e.created_at DESC)
        FROM evidence e
        WHERE e.task_id = t.id
      ), '[]'::jsonb) AS evidence
    FROM tasks t
    WHERE t.id = $1
  `, [id]);
}

export function createTask({ title, rawNotes, status }) {
  return pool.query("INSERT INTO tasks (title, raw_notes, status, completed_at) VALUES ($1, $2, $3::varchar, CASE WHEN $3::varchar = 'completed' THEN NOW() ELSE NULL END) RETURNING *", [title, rawNotes, status]);
}

export function updateTask(id, updates) {
  const fields = ["title", "raw_notes", "status"].filter((field) => Object.hasOwn(updates, field));
  if (!fields.length) return null;
  const values = fields.map((field) => updates[field]);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  if (Object.hasOwn(updates, "status")) assignments.push(`completed_at = CASE WHEN $${fields.indexOf("status") + 1}::varchar = 'completed' THEN COALESCE(completed_at, NOW()) ELSE NULL END`);
  values.push(id);
  return pool.query(`UPDATE tasks SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
}

export function completeTask(id) {
  return pool.query("UPDATE tasks SET status = 'completed', completed_at = COALESCE(completed_at, NOW()) WHERE id = $1 RETURNING *", [id]);
}

// Archiving preserves the task and all linked evidence. The evidence FK uses
// ON DELETE SET NULL, but this endpoint deliberately never deletes the row.
export function archiveTask(id) {
  return pool.query("UPDATE tasks SET status = 'archived', completed_at = NULL WHERE id = $1 RETURNING *", [id]);
}
