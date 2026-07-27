import assert from "node:assert/strict";
import test from "node:test";
import { isAdminEmail } from "../lib/auth";

test("authorizes only the configured administrator", () => {
  assert.equal(isAdminEmail("m.rossiflorent@gmail.com"), true);
  assert.equal(isAdminEmail("M.ROSSIFLORENT@GMAIL.COM"), true);
  assert.equal(isAdminEmail("other@example.com"), false);
  assert.equal(isAdminEmail(null), false);
});
