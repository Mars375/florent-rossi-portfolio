import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps public Storage URLs readable without allowing bucket listing", async () => {
  const sql = await readFile(
    "supabase/migrations/202607270001_portfolio_admin.sql",
    "utf8",
  );

  assert.doesNotMatch(sql, /Portfolio media is publicly readable/);
});

test("uses least-privilege table grants and indexes the audit foreign key", async () => {
  const migrations = (
    await Promise.all([
      readFile(
        "supabase/migrations/202607270001_portfolio_admin.sql",
        "utf8",
      ),
      readFile(
        "supabase/migrations/202607270002_harden_portfolio_access.sql",
        "utf8",
      ).catch(() => ""),
    ])
  ).join("\n");

  assert.match(
    migrations,
    /revoke all on table public\.portfolio_documents from anon, authenticated/i,
  );
  assert.match(
    migrations,
    /create index.+portfolio_documents_updated_by/i,
  );
  assert.match(
    migrations,
    /revoke all on function public\.publish_portfolio\(jsonb\) from public, anon, service_role/i,
  );
});
