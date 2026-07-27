import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "../lib/auth";

test("keeps authentication redirects on the same origin", () => {
  assert.equal(safeNextPath("/admin?tab=projects"), "/admin?tab=projects");
  assert.equal(safeNextPath("https://evil.example/"), "/admin");
  assert.equal(safeNextPath("//evil.example/"), "/admin");
  assert.equal(safeNextPath(null), "/admin");
});
