import { pool } from '../db.js'

// Progress is based on evidence belonging to a task the user has completed.
// AI recommendations and unreviewed links never count.
export function getProgress() {
  return pool.query(`WITH ksb_progress AS (
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM evidence_ksbs ek JOIN evidence e ON e.id = ek.evidence_id JOIN tasks t ON t.id = e.task_id WHERE ek.ksb_id = k.id AND ek.review_status = 'accepted' AND t.status = 'completed'))::int AS evidenced FROM ksbs k
  ), ac_progress AS (
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM evidence_acceptance_criteria eac JOIN evidence e ON e.id = eac.evidence_id JOIN tasks t ON t.id = e.task_id WHERE eac.acceptance_criteria_id = ac.id AND eac.review_status = 'accepted' AND t.status = 'completed') AND NOT EXISTS (SELECT 1 FROM acceptance_criteria_ksbs ack WHERE ack.acceptance_criteria_id = ac.id AND NOT EXISTS (SELECT 1 FROM evidence_acceptance_criteria eac JOIN evidence_ksbs ek ON ek.evidence_id = eac.evidence_id AND ek.ksb_id = ack.ksb_id AND ek.review_status = 'accepted' JOIN evidence e ON e.id = eac.evidence_id JOIN tasks t ON t.id = e.task_id WHERE eac.acceptance_criteria_id = ac.id AND eac.review_status = 'accepted' AND t.status = 'completed')))::int AS complete FROM acceptance_criteria ac
  ) SELECT json_build_object('total', kp.total, 'evidenced', kp.evidenced, 'percentage', CASE WHEN kp.total = 0 THEN 0 ELSE ROUND(kp.evidenced * 100.0 / kp.total, 1) END) AS ksbs, json_build_object('total', ap.total, 'complete', ap.complete, 'percentage', CASE WHEN ap.total = 0 THEN 0 ELSE ROUND(ap.complete * 100.0 / ap.total, 1) END) AS acceptance_criteria FROM ksb_progress kp CROSS JOIN ac_progress ap`)
}
