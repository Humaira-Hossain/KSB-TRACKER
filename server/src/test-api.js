// Start the API in another terminal, then run: npm run test:api
// Set API_BASE_URL if it is not running on http://localhost:5000.
const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
}

const task = await request("/api/tasks", {
  method: "POST",
  body: JSON.stringify({ title: "API verification task", rawNotes: "Created by the API verification script." }),
});

const updatedTask = await request(`/api/tasks/${task.id}`, {
  method: "PATCH",
  body: JSON.stringify({ rawNotes: "Updated by the API verification script.", status: "ready_for_review" }),
});

const evidence = await request(`/api/tasks/${task.id}/evidence`, {
  method: "POST",
  body: JSON.stringify({ title: "API verification evidence", situation: "Testing the backend", task: "Verify core routes", action: "Called each endpoint", result: "Requests completed" }),
});

const [ksb] = await request("/api/ksbs");
const [acceptanceCriterion] = await request("/api/acceptance-criteria");
if (!ksb || !acceptanceCriterion) throw new Error("The database must contain at least one KSB and one acceptance criterion.");

await request(`/api/evidence/${evidence.id}/ksbs`, {
  method: "POST",
  body: JSON.stringify({ ksbId: ksb.id }),
});
await request(`/api/evidence/${evidence.id}/acceptance-criteria`, {
  method: "POST",
  body: JSON.stringify({ acceptanceCriterionId: acceptanceCriterion.id }),
});

const taskDetail = await request(`/api/tasks/${task.id}`);
const acDetail = await request(`/api/acceptance-criteria/${acceptanceCriterion.id}`);
const ksbDetail = await request(`/api/ksbs/${ksb.id}`);
const acEvidenceByCode = await request(`/api/acceptance-criteria/${acceptanceCriterion.code}/evidence`);
const ksbEvidenceByCode = await request(`/api/ksbs/${ksb.code}/evidence`);
const progress = await request("/api/progress");

const hasEvidence = (items) => items.some((item) => String(item.id) === String(evidence.id));
if (!hasEvidence(taskDetail.evidence)) throw new Error("Task detail did not include the created evidence.");
if (!hasEvidence(acDetail.evidence)) throw new Error("AC detail did not include linked evidence.");
if (!hasEvidence(ksbDetail.evidence)) throw new Error("KSB detail did not include linked evidence.");
if (!hasEvidence(acEvidenceByCode.evidence)) throw new Error("AC code evidence endpoint did not include linked evidence.");
if (!hasEvidence(ksbEvidenceByCode.evidence)) throw new Error("KSB code evidence endpoint did not include linked evidence.");

// Leave an auditable record but keep the normal task list uncluttered.
const archivedTask = await request(`/api/tasks/${task.id}`, { method: "DELETE" });

console.log("API verification passed.");
console.table([{ taskId: task.id, updatedStatus: updatedTask.status, archivedStatus: archivedTask.status, evidenceId: evidence.id, ac: acceptanceCriterion.code, ksb: ksb.code, progress: JSON.stringify(progress) }]);
