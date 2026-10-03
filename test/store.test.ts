import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/server/store.ts";

const tmp = () => join(mkdtempSync(join(tmpdir(), "ag-store-")), "household.json");

test("profiles persist across restarts", () => {
  const path = tmp();
  new Store(path).savePerson({ name: "Maya", allergies: ["peanut"], guest: false });
  assert.deepEqual(new Store(path).find("maya")?.allergies, ["peanut"]);
});

test("guests drop out after their last day", () => {
  const s = new Store(tmp());
  s.savePerson({ name: "Leo", allergies: ["milk"], guest: true, until: "2026-10-10" });
  s.savePerson({ name: "Maya", allergies: ["peanut"], guest: false });
  assert.deepEqual(s.activePeople("2026-10-10").map((p) => p.name).sort(), ["Leo", "Maya"]);
  assert.deepEqual(s.activePeople("2026-10-11").map((p) => p.name), ["Maya"]);
});

test("saving the same name updates instead of duplicating", () => {
  const s = new Store(tmp());
  s.savePerson({ name: "Maya", allergies: ["peanut"], guest: false });
  s.savePerson({ name: "maya", allergies: ["sesame"], guest: false });
  assert.equal(s.allPeople().length, 1);
  assert.deepEqual(s.find("Maya")?.allergies, ["sesame"]);
});

test("a corrupt household file refuses to start empty", () => {
  const path = tmp();
  writeFileSync(path, "{not json");
  assert.throws(() => new Store(path), /refusing to start with an empty household/);
});
