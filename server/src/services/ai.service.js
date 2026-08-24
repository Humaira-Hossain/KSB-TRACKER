import { httpError } from "../utils/request.js";

const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
const model = process.env.NVIDIA_MODEL;

function aiResponseError(message) {
  return httpError(502, `AI response was invalid: ${message}`);
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw aiResponseError(`${field} must be a non-empty string.`);
  return value.trim();
}

function confidence(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw aiResponseError("confidence must be a number from 0 to 1.");
  return value;
}

function validateSuggestions(items, field, catalogue) {
  if (!Array.isArray(items)) throw aiResponseError(`${field} must be an array.`);
  const seen = new Set();
  return items.map((item) => {
    if (!item || typeof item !== "object") throw aiResponseError(`${field} contains an invalid item.`);
    const code = requiredText(item.code, `${field}.code`).toUpperCase();
    if (!catalogue.has(code)) throw aiResponseError(`${field} contains unknown code ${code}.`);
    if (seen.has(code)) throw aiResponseError(`${field} contains duplicate code ${code}.`);
    seen.add(code);
    return { code, confidence: confidence(item.confidence), rationale: requiredText(item.rationale, `${field}.rationale`) };
  });
}

function validateGeneration(content, ksbs, acceptanceCriteria) {
  let parsed;
  try { parsed = JSON.parse(content); } catch { throw aiResponseError("model content was not JSON."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw aiResponseError("model content must be a JSON object.");
  const title = requiredText(parsed.title, "title");
  if (title.length > 255) throw aiResponseError("title is longer than 255 characters.");
  return {
    title,
    situation: requiredText(parsed.situation, "situation"),
    task: requiredText(parsed.task, "task"),
    action: requiredText(parsed.action, "action"),
    result: requiredText(parsed.result, "result"),
    ksbSuggestions: validateSuggestions(parsed.ksbSuggestions, "ksbSuggestions", new Map(ksbs.map((item) => [item.code, item]))),
    acSuggestions: validateSuggestions(parsed.acSuggestions, "acSuggestions", new Map(acceptanceCriteria.map((item) => [item.code, item]))),
  };
}

function prompt(rawNotes, ksbs, acceptanceCriteria) {
  return `You are assisting an apprenticeship evidence tracker. Rewrite the rough notes into a professional, truthful STAR account. Suggest only relevant catalogue items; suggestions are not proof that a KSB or AC is met. Never state that any AC or KSB is definitely complete, achieved, or met.

Return JSON only, matching this exact shape:
{"title":"string","situation":"string","task":"string","action":"string","result":"string","ksbSuggestions":[{"code":"K1","confidence":0.0,"rationale":"short reason"}],"acSuggestions":[{"code":"AC01","confidence":0.0,"rationale":"short reason"}]}

Use confidence numbers from 0 to 1. Use empty arrays where no suggestion is justified.

ROUGH NOTES:
${rawNotes}

KSB CATALOGUE:
${JSON.stringify(ksbs.map(({ code, type, description }) => ({ code, type, description })))}

AC CATALOGUE:
${JSON.stringify(acceptanceCriteria.map(({ code, level, description, keywords, required_ksb_codes }) => ({ code, level, description, keywords, requiredKsbCodes: required_ksb_codes })))}
`;
}

export async function generateEvidenceFromNotes({ rawNotes, ksbs, acceptanceCriteria }) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw httpError(500, "NVIDIA_API_KEY is not configured.");

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 2500,
        stream: false,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt(rawNotes, ksbs, acceptanceCriteria) }],
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    console.error("NVIDIA fetch failed:", error);
    throw httpError(502, "AI service could not be reached.");
  }

  if (!response.ok) throw httpError(502, `AI service failed with status ${response.status}.`);

  let payload;
  try { payload = await response.json(); } catch { throw aiResponseError("AI service did not return JSON."); }
  const content = payload?.choices?.[0]?.message?.content;
  console.log("NVIDIA AI response content:", content);
  if (typeof content !== "string") throw aiResponseError("AI service response did not contain message content.");
  return validateGeneration(content, ksbs, acceptanceCriteria);
}
