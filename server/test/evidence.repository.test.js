import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { pool } from "../src/db.js";
import { saveGeneratedEvidence } from "../src/repositories/evidence.repository.js";

const originalConnect = pool.connect;

afterEach(() => {
  pool.connect = originalConnect;
});

const generated = {
  title: "Generated evidence",
  situation: "Situation",
  task: "Task",
  action: "Action",
  result: "Result",
};

test("saveGeneratedEvidence saves STAR and pending suggestions in one transaction", async () => {
  const calls = [];
  const client = {
    query: async (text, values) => {
      calls.push({ text, values });
      if (text.startsWith("SELECT task_id")) return { rows: [{ task_id: "7", ai_generated: false }] };
      if (text.startsWith("SELECT id FROM evidence WHERE task_id")) return { rows: [], rowCount: 0 };
      if (text.startsWith("UPDATE evidence SET")) return { rows: [{ id: "9", ai_generated: true, status: "awaiting_review" }] };
      return { rows: [], rowCount: 0 };
    },
    release: () => calls.push({ text: "RELEASE" }),
  };
  pool.connect = async () => client;

  const result = await saveGeneratedEvidence("9", generated, {
    ksbs: [{ id: "1", confidence: 0.8 }],
    acceptanceCriteria: [{ id: "2", confidence: 0.7 }],
  });

  assert.equal(result.status, "awaiting_review");
  assert.equal(calls[0].text, "BEGIN");
  assert.ok(calls.some((call) => call.text.startsWith("SELECT id FROM tasks WHERE id = $1 FOR UPDATE")));
  assert.ok(calls.some((call) => call.text.startsWith("INSERT INTO evidence_ksbs")));
  assert.ok(calls.some((call) => call.text.startsWith("INSERT INTO evidence_acceptance_criteria")));
  assert.ok(calls.some((call) => call.text === "COMMIT"));
  assert.equal(calls.at(-1).text, "RELEASE");
});

test("saveGeneratedEvidence rolls back if the task already has generated STAR", async () => {
  const calls = [];
  const client = {
    query: async (text) => {
      calls.push(text);
      if (text.startsWith("SELECT task_id")) return { rows: [{ task_id: "7", ai_generated: false }] };
      if (text.startsWith("SELECT id FROM evidence WHERE task_id")) return { rows: [{ id: "8" }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    },
    release: () => calls.push("RELEASE"),
  };
  pool.connect = async () => client;

  await assert.rejects(
    () => saveGeneratedEvidence("9", generated, { ksbs: [], acceptanceCriteria: [] }),
    (error) => error.status === 409 && error.message.includes("already been generated for this task"),
  );

  assert.ok(calls.includes("ROLLBACK"));
  assert.equal(calls.at(-1), "RELEASE");
});
