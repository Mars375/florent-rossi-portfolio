import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { requestAdminMagicLink } from "../lib/admin-login";

function withAdminEnv(
  values: { ADMIN_EMAILS?: string; ADMIN_EMAIL?: string },
  assertion: () => Promise<void>,
) {
  const previousEmails = process.env.ADMIN_EMAILS;
  const previousEmail = process.env.ADMIN_EMAIL;

  return (async () => {
    try {
      delete process.env.ADMIN_EMAILS;
      delete process.env.ADMIN_EMAIL;
      if (values.ADMIN_EMAILS !== undefined) {
        process.env.ADMIN_EMAILS = values.ADMIN_EMAILS;
      }
      if (values.ADMIN_EMAIL !== undefined) {
        process.env.ADMIN_EMAIL = values.ADMIN_EMAIL;
      }
      await assertion();
    } finally {
      if (previousEmails === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = previousEmails;
      if (previousEmail === undefined) delete process.env.ADMIN_EMAIL;
      else process.env.ADMIN_EMAIL = previousEmail;
    }
  })();
}

test("requests an OTP for a secondary configured administrator", async () => {
  await withAdminEnv(
    {
      ADMIN_EMAILS:
        "m.rossiflorent@gmail.com,rossi.loic1@gmail.com",
    },
    async () => {
      let requestedEmail: string | undefined;

      const result = await requestAdminMagicLink(
        " ROSSI.LOIC1@GMAIL.COM ",
        async (email) => {
          requestedEmail = email;
        },
      );

      assert.equal(result, true);
      assert.equal(requestedEmail, "ROSSI.LOIC1@GMAIL.COM");
    },
  );
});

test("keeps the configured administrator allow-list and OTP request server-side", async () => {
  const [clientSource, actionSource] = await Promise.all([
    readFile("app/admin/login/LoginForm.tsx", "utf8"),
    readFile("app/admin/login/actions.ts", "utf8"),
  ]);

  assert.match(
    clientSource,
    /import \{ requestAdminMagicLinkAction \} from "\.\/actions"/,
  );
  assert.doesNotMatch(
    clientSource,
    /isAdminEmail|ADMIN_EMAILS|createBrowserSupabaseClient|signInWithOtp/,
  );
  assert.match(actionSource, /^"use server";/);
  assert.match(actionSource, /requestAdminMagicLink\(email/);
  assert.match(actionSource, /createServerSupabaseClient/);
  assert.match(actionSource, /signInWithOtp/);
});
