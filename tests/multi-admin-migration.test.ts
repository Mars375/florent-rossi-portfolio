import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/202607280001_multi_admin_authorization.sql";

test("centralizes the two database administrators in a fixed-path helper", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const helperSql =
    sql.match(
      /create or replace function public\.is_portfolio_admin\(\)[\s\S]*?\$\$;/i,
    )?.[0] ?? "";

  assert.match(
    helperSql,
    /language sql[\s\S]+?stable[\s\S]+?security invoker[\s\S]+?set search_path = ''/i,
  );
  assert.doesNotMatch(helperSql, /security definer/i);
  assert.match(
    sql,
    /in \(\s*'m\.rossiflorent@gmail\.com',\s*'rossi\.loic1@gmail\.com'\s*\)/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.is_portfolio_admin\(\) from public;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.is_portfolio_admin\(\) to anon, authenticated;/i,
  );
});

test("replaces every document, Storage, and publish authorization check with the helper", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const policies = [
    "Published portfolio is publicly readable",
    "Administrator can insert portfolio documents",
    "Administrator can update portfolio documents",
    "Administrator can delete portfolio documents",
    "Administrator can upload portfolio media",
    "Administrator can update portfolio media",
    "Administrator can delete portfolio media",
  ];

  for (const policy of policies) {
    assert.match(
      sql,
      new RegExp(`drop policy if exists "${policy}"`, "i"),
    );
    assert.match(sql, new RegExp(`create policy "${policy}"`, "i"));
  }

  assert.equal((sql.match(/is_portfolio_admin\(\)/gi) ?? []).length, 13);
  assert.match(
    sql,
    /if not \(select public\.is_portfolio_admin\(\)\) then/i,
  );
  assert.doesNotMatch(
    sql,
    /lower\(coalesce\(\(select auth\.jwt\(\)\)\s*->>\s*'email',\s*''\)\)\s*(?:=|<>)/i,
  );
});
