import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { generateEvidenceFromNotes } from "../src/services/ai.service.js";

const originalFetch = global.fetch;
const originalApiKey = process.env.NVIDIA_API_KEY;

const catalogue = {
  ksbs: [{ code: "K1", type: "Knowledge", description: "Software development lifecycle." }],
  acceptanceCriteria: [{ code: "AC01", description: "Describe the lifecycle.", required_ksb_codes: ["K1"] }],
};

afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.NVIDIA_API_KEY;
  else process.env.NVIDIA_API_KEY = originalApiKey;
});

test("generateEvidenceFromNotes sends catalogue context and returns validated structured output", async () => {
  process.env.NVIDIA_API_KEY = "test-key";
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              title: "Lifecycle explanation",
              situation: "I needed to explain the development lifecycle.",
              task: "Prepare a clear explanation.",
              action: "I documented each stage.",
              result: "The team understood the lifecycle.",
              ksbSuggestions: [{ code: "K1", confidence: 0.9, rationale: "The evidence discusses lifecycle stages." }],
              acSuggestions: [{ code: "AC01", confidence: 0.8, rationale: "The notes describe the lifecycle." }],
            }),
          },
        }],
      }),
    };
  };

  const result = await generateEvidenceFromNotes({ rawNotes: "Explained SDLC stages", ...catalogue });

  assert.equal(requestBody.response_format.type, "json_object");
  assert.match(requestBody.messages[0].content, /Explained SDLC stages/);
  assert.deepEqual(result.ksbSuggestions[0], { code: "K1", confidence: 0.9, rationale: "The evidence discusses lifecycle stages." });
  assert.deepEqual(result.acSuggestions[0], { code: "AC01", confidence: 0.8, rationale: "The notes describe the lifecycle." });
});

test("generateEvidenceFromNotes fails clearly when the API key is absent", async () => {
  delete process.env.NVIDIA_API_KEY;

  await assert.rejects(
    () => generateEvidenceFromNotes({ rawNotes: "Notes", ...catalogue }),
    (error) => error.status === 500 && error.message === "NVIDIA_API_KEY is not configured.",
  );
});

test("generateEvidenceFromNotes logs the underlying fetch failure", async () => {
  process.env.NVIDIA_API_KEY = "test-key";
  const networkError = new Error("certificate verification failed");
  const log = test.mock.method(console, "error", () => {});
  global.fetch = async () => { throw networkError; };

  await assert.rejects(
    () => generateEvidenceFromNotes({ rawNotes: "Notes", ...catalogue }),
    (error) => error.status === 502 && error.message === "AI service could not be reached.",
  );

  assert.deepEqual(log.mock.calls[0].arguments, ["NVIDIA fetch failed:", networkError]);
});

test("generateEvidenceFromNotes rejects malformed model JSON", async () => {
  process.env.NVIDIA_API_KEY = "test-key";
  const log = test.mock.method(console, "log", () => {});
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: "not JSON" } }] }),
  });

  await assert.rejects(
    () => generateEvidenceFromNotes({ rawNotes: "Notes", ...catalogue }),
    (error) => error.status === 502 && error.message.includes("model content was not JSON"),
  );

  assert.deepEqual(log.mock.calls[0].arguments, ["NVIDIA AI response content:", "not JSON"]);
});

test("generateEvidenceFromNotes rejects suggestions outside the supplied catalogue", async () => {
  process.env.NVIDIA_API_KEY = "test-key";
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "Evidence",
            situation: "Situation",
            task: "Task",
            action: "Action",
            result: "Result",
            ksbSuggestions: [{ code: "K999", confidence: 0.5, rationale: "Unknown." }],
            acSuggestions: [],
          }),
        },
      }],
    }),
  });

  await assert.rejects(
    () => generateEvidenceFromNotes({ rawNotes: "Notes", ...catalogue }),
    (error) => error.status === 502 && error.message.includes("unknown code K999"),
  );
});
