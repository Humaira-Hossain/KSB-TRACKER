import assert from "node:assert/strict";
import test from "node:test";
import { httpError, idFrom, requireChoice, requireText } from "../src/utils/request.js";

test("idFrom accepts a positive numeric route parameter", () => {
  assert.equal(idFrom({ params: { id: "42" } }), 42);
});

test("idFrom rejects invalid route parameters", () => {
  assert.throws(
    () => idFrom({ params: { id: "AC03" } }),
    (error) => error.status === 400 && error.message === "Invalid id.",
  );
});

test("requireText trims valid text and rejects blank input", () => {
  assert.equal(requireText("  Rough notes  ", "rawNotes"), "Rough notes");
  assert.throws(
    () => requireText("   ", "rawNotes"),
    (error) => error.status === 400 && error.message === "rawNotes is required.",
  );
});

test("requireChoice accepts only configured values", () => {
  const statuses = new Set(["draft", "completed"]);
  assert.equal(requireChoice("draft", statuses, "status"), "draft");
  assert.throws(
    () => requireChoice("deleted", statuses, "status"),
    (error) => error.status === 400 && error.message === "Invalid status.",
  );
});

test("httpError carries its HTTP status", () => {
  const error = httpError(409, "Already generated.");
  assert.equal(error.status, 409);
  assert.equal(error.message, "Already generated.");
});
