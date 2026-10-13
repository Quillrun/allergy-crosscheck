import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, isExpired } from "../src/server/store.ts";

const dirs: string[] = [];
const tmp = () => {
  dirs.push(mkdtempSync(join(tmpdir(), "ag-store-")));
  return join(dirs.at(-1)!, "household.json");
};
after(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

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

test("saving the same name adds allergies, keeps the first spelling, and replaces only when asked", () => {
  const s = new Store(tmp());
  s.savePerson({ name: "Maya", allergies: ["peanut"], guest: false });
  s.savePerson({ name: "MAYA", allergies: ["sesame"], guest: false });
  assert.equal(s.allPeople().length, 1);
  assert.equal(s.allPeople()[0].name, "Maya");
  assert.deepEqual(s.find("Maya")?.allergies, ["peanut", "sesame"]); // "Maya is also allergic to sesame" must not drop peanuts
  s.savePerson({ name: "maya", allergies: ["sesame"], guest: false }, true);
  assert.deepEqual(s.find("Maya")?.allergies, ["sesame"]);
});

test("a corrupt household file refuses to start empty", () => {
  const path = tmp();
  writeFileSync(path, "{not json");
  assert.throws(() => new Store(path), /refusing to start with an empty household/);
});

test("re-saving without guest or until keeps a guest's status and end date; saying so changes it", () => {
  const s = new Store(tmp());
  s.savePerson({ name: "Leo", allergies: ["milk"], guest: true, until: "2026-10-10" });
  s.savePerson({ name: "leo", allergies: ["egg"] });
  const leo = s.find("Leo")!;
  assert.deepEqual([leo.guest, leo.until, leo.allergies], [true, "2026-10-10", ["milk", "egg"]]);
  assert.deepEqual(s.activePeople("2026-10-11"), []); // an expired guest stays expired
  s.savePerson({ name: "Leo", allergies: ["egg"], until: "2026-12-01" });
  assert.deepEqual([s.find("Leo")!.guest, s.find("Leo")!.until], [true, "2026-12-01"]);
  s.savePerson({ name: "Leo", allergies: ["egg"], guest: false });
  assert.deepEqual([s.find("Leo")!.guest, s.find("Leo")!.until], [false, undefined]); // explicitly a member now
  s.savePerson({ name: "Ana", allergies: ["fish"] });
  assert.deepEqual([s.find("Ana")!.guest, s.find("Ana")!.until], [false, undefined]); // new people default to household members
});

test("a guest's last day is still a visit; the day after is not; no end date never expires", () => {
  assert.equal(isExpired({ until: "2026-10-10" }, "2026-10-10"), false);
  assert.equal(isExpired({ until: "2026-10-10" }, "2026-10-11"), true);
  assert.equal(isExpired({}, "2999-12-31"), false);
  const s = new Store(tmp());
  s.savePerson({ name: "Leo", allergies: ["milk"], guest: true, until: "2026-10-10" });
  assert.deepEqual(s.expiredPeople("2026-10-10"), []);
  assert.deepEqual(s.expiredPeople("2026-10-11").map((p) => p.name), ["Leo"]);
});
