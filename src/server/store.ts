// Household state: who eats here, what they're allergic to, the shopping list, and the last barcode scanned on a phone.
// One JSON file per self-hosted household, written atomically.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ALLERGENS } from "../../packages/allergen-guard/src/index.ts";
import type { AllergenId } from "../../packages/allergen-guard/src/index.ts";

export type Profile = { name: string; allergies: AllergenId[]; guest: boolean; until?: string };
export type ListItem = { item: string; note?: string; added: string };
export type Scan = { barcode: string; name?: string; at: string };
type State = { people: Profile[]; shopping: ListItem[]; lastScan?: Scan };

/** A scan only stands in for "what I just scanned" for this long. */
export const SCAN_TTL_MS = 30 * 60 * 1000;

export class Store {
  private path: string;
  private state: State;

  constructor(path: string) {
    this.path = path;
    this.state = load(path);
  }

  /** Household members, plus guests whose visit hasn't ended. */
  activePeople(today = localDate()): Profile[] {
    return this.state.people.filter((p) => !isExpired(p, today));
  }

  /** Guests whose last day has passed: still saved, no longer checked unless asked for by name. */
  expiredPeople(today = localDate()): Profile[] {
    return this.state.people.filter((p) => isExpired(p, today));
  }

  allPeople(): Profile[] {
    return [...this.state.people];
  }

  find(name: string): Profile | undefined {
    return this.state.people.find((p) => same(p.name, name));
  }

  /**
   * Saves someone. By default new allergies are added to what's saved; `replace` swaps the list. The first spelling of a name is kept.
   * Saving an existing person without `guest` or `until` keeps their guest status and end date: an update to the allergies
   * must not make a guest permanent or bring an expired one back.
   */
  savePerson(profile: Omit<Profile, "guest"> & { guest?: boolean }, replace = false): { saved: Profile; before?: Profile } {
    const before = this.find(profile.name);
    const keepStatus = before && profile.guest === undefined && profile.until === undefined;
    const status = keepStatus ? { guest: before.guest, until: before.until } : { guest: profile.guest ?? Boolean(profile.until), until: profile.until };
    const saved: Profile = before
      ? { ...profile, ...status, name: before.name, allergies: replace ? profile.allergies : [...new Set([...before.allergies, ...profile.allergies])] }
      : { ...profile, ...status };
    this.state.people = [...this.state.people.filter((p) => !same(p.name, profile.name)), saved];
    this.flush();
    return { saved, before };
  }

  removePerson(name: string): boolean {
    const before = this.state.people.length;
    this.state.people = this.state.people.filter((p) => !same(p.name, name));
    this.flush();
    return this.state.people.length < before;
  }

  shopping(): ListItem[] {
    return [...this.state.shopping];
  }

  addItems(items: string[], note?: string): ListItem[] {
    const added = new Date().toISOString();
    for (const item of items.map((i) => i.trim()).filter(Boolean)) {
      if (!this.state.shopping.some((s) => same(s.item, item))) this.state.shopping.push({ item, note, added });
    }
    this.flush();
    return this.shopping();
  }

  removeItem(item: string): boolean {
    const before = this.state.shopping.length;
    this.state.shopping = this.state.shopping.filter((s) => !same(s.item, item));
    this.flush();
    return this.state.shopping.length < before;
  }

  saveScan(barcode: string, name?: string, at = new Date()): Scan {
    this.state.lastScan = { barcode, name, at: at.toISOString() };
    this.flush();
    return this.state.lastScan;
  }

  /** The last scan, if it is recent enough to be what someone means by "what I just scanned". */
  recentScan(now = new Date()): Scan | undefined {
    const s = this.state.lastScan;
    return s && now.getTime() - Date.parse(s.at) <= SCAN_TTL_MS ? s : undefined;
  }

  private flush() {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.state, null, 2));
    renameSync(tmp, this.path);
  }
}

function load(path: string): State {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<State>;
    // A file that parses but is not a household (a renamed key, an unknown allergen id) must not become an empty one, or fail later at ALLERGENS[id].label.
    if (!Array.isArray(parsed?.people)) throw new Error("no people list");
    for (const p of parsed.people) for (const a of p?.allergies ?? []) if (!Object.hasOwn(ALLERGENS, a)) throw new Error(`unknown allergen id ${JSON.stringify(a)} for ${p.name}`);
    return { people: parsed.people, shopping: parsed.shopping ?? [], lastScan: parsed.lastScan };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { people: [], shopping: [] };
    throw new Error(`Household file ${path} is unreadable; refusing to start with an empty household. ${String(err)}`);
  }
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** YYYY-MM-DD in the server's time zone: a guest "until Saturday" means the household's Saturday, not UTC's. */
/** A guest whose last day has passed. One rule for who is checked, who is listed as ended, and which dates may be saved. */
export const isExpired = (p: { until?: string }, today = localDate()): boolean => Boolean(p.until && p.until < today);

export const localDate = (d = new Date()): string => d.toLocaleDateString("en-CA");
