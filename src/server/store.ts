// Household state: who eats here, what they're allergic to, and the shopping list.
// One JSON file per self-hosted household, written atomically.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AllergenId } from "../../packages/allergen-guard/src/index.ts";

export type Profile = { name: string; allergies: AllergenId[]; guest: boolean; until?: string };
export type ListItem = { item: string; note?: string; added: string };
type State = { people: Profile[]; shopping: ListItem[] };

export class Store {
  private path: string;
  private state: State;

  constructor(path: string) {
    this.path = path;
    this.state = load(path);
  }

  /** Household members, plus guests whose visit hasn't ended. */
  activePeople(today = new Date().toISOString().slice(0, 10)): Profile[] {
    return this.state.people.filter((p) => !p.guest || !p.until || p.until >= today);
  }

  allPeople(): Profile[] {
    return [...this.state.people];
  }

  find(name: string): Profile | undefined {
    return this.state.people.find((p) => same(p.name, name));
  }

  savePerson(profile: Profile): Profile {
    this.state.people = [...this.state.people.filter((p) => !same(p.name, profile.name)), profile];
    this.flush();
    return profile;
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
    return { people: parsed.people ?? [], shopping: parsed.shopping ?? [] };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { people: [], shopping: [] };
    throw new Error(`Household file ${path} is unreadable; refusing to start with an empty household. ${String(err)}`);
  }
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
