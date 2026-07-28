import assert from "node:assert/strict";
import test from "node:test";
import { configuredAdminEmails, isAdminEmail } from "../lib/auth";

function withAdminEnv(
  values: { ADMIN_EMAILS?: string; ADMIN_EMAIL?: string },
  assertion: () => void,
) {
  const previousEmails = process.env.ADMIN_EMAILS;
  const previousEmail = process.env.ADMIN_EMAIL;

  try {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;
    if (values.ADMIN_EMAILS !== undefined) {
      process.env.ADMIN_EMAILS = values.ADMIN_EMAILS;
    }
    if (values.ADMIN_EMAIL !== undefined) {
      process.env.ADMIN_EMAIL = values.ADMIN_EMAIL;
    }
    assertion();
  } finally {
    if (previousEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousEmails;
    if (previousEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousEmail;
  }
}

test("authorizes every normalized ADMIN_EMAILS entry", () => {
  withAdminEnv(
    {
      ADMIN_EMAILS:
        " m.rossiflorent@gmail.com, ROSSI.LOIC1@GMAIL.COM, ,rossi.loic1@gmail.com ",
    },
    () => {
      assert.deepEqual(configuredAdminEmails(), [
        "m.rossiflorent@gmail.com",
        "rossi.loic1@gmail.com",
      ]);
      assert.equal(isAdminEmail("rossi.loic1@gmail.com"), true);
      assert.equal(isAdminEmail(" M.ROSSIFLORENT@GMAIL.COM "), true);
      assert.equal(isAdminEmail("other@example.com"), false);
      assert.equal(isAdminEmail(null), false);
    },
  );
});

test("falls back through ADMIN_EMAIL and then the Florent default", () => {
  withAdminEnv(
    { ADMIN_EMAILS: " , ", ADMIN_EMAIL: " Legacy@Example.com " },
    () => {
      assert.deepEqual(configuredAdminEmails(), ["legacy@example.com"]);
      assert.equal(isAdminEmail("LEGACY@example.com"), true);
    },
  );

  withAdminEnv({}, () => {
    assert.deepEqual(configuredAdminEmails(), [
      "m.rossiflorent@gmail.com",
    ]);
  });
});
