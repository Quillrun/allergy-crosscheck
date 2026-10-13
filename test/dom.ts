// Runs the inline script of a page in public/ against a hand-made DOM, so a page's behaviour can be tested without a browser.
// Only what these pages touch exists; an element is made the first time its id is asked for.

import { readFileSync } from "node:fs";
import vm from "node:vm";

export class El {
  id: string;
  textContent = "";
  innerHTML = "";
  hidden = false;
  value = "";
  dataset: Record<string, string> = {};
  clientWidth = 1280;
  parentElement?: El;
  contentWindow: { sent: unknown[]; postMessage: (m: unknown) => void } = { sent: [], postMessage(m) { this.sent.push(m); } };
  style: Record<string, unknown> & { setProperty: (k: string, v: string) => void } = { setProperty() {} };
  classes = new Set<string>();
  classList = { add: (c: string) => void this.classes.add(c), remove: (c: string) => void this.classes.delete(c) };
  listeners = new Map<string, ((e: unknown) => unknown)[]>();
  constructor(id: string) {
    this.id = id;
  }
  addEventListener(type: string, fn: (e: unknown) => unknown) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  /** Calls the listeners without waiting for what they return: a handler may wait on a host reply the test sends next. */
  fire(type: string, event: Record<string, unknown> = {}) {
    for (const fn of this.listeners.get(type) ?? []) void Promise.resolve(fn({ preventDefault() {}, ...event }));
  }
  querySelectorAll() {
    return [] as El[];
  }
  getBoundingClientRect() {
    return { width: 768, height: 480 };
  }
  append() {}
  appendChild() {}
  prepend() {}
  observe() {}
}

export type Page = {
  /** The context the script ran in: window and the globals it saw. */
  win: Record<string, any>;
  el: (id: string) => El;
  /** Let pending promises settle, and run the timers that are due (timers are manual: nothing runs until asked). */
  settle: () => Promise<void>;
  /** Run every timer that is queued right now, once, then settle. */
  tick: () => Promise<void>;
  timers: { id: number; fn: () => void; ms: number }[];
};

type Options = {
  /** Extra globals, e.g. a fake fetch or location. */
  globals?: Record<string, unknown>;
  /** Which `<script>` block to run (default: the last inline one). */
  script?: number;
};

export async function loadPage(file: string, opts: Options = {}): Promise<Page> {
  const html = readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const source = scripts[opts.script ?? scripts.length - 1];
  const els = new Map<string, El>();
  const el = (id: string) => {
    if (!els.has(id)) {
      const e = new El(id);
      e.parentElement = new El(`${id}-parent`);
      els.set(id, e);
    }
    return els.get(id)!;
  };
  const timers: { id: number; fn: () => void; ms: number }[] = [];
  let timerId = 0;
  const listeners = new Map<string, ((e: unknown) => unknown)[]>();
  const root = new El("html");
  const win: Record<string, any> = {
    document: {
      getElementById: el,
      documentElement: root,
      head: new El("head"),
      createElement: (tag: string) => new El(tag),
    },
    navigator: { vibrate() {} },
    location: { hash: "", search: "" },
    isSecureContext: true,
    console: { ...console, error() {}, warn() {} }, // a page's console.error is part of its failure path, not the test's output
    setTimeout: (fn: () => void, ms = 0) => (timers.push({ id: ++timerId, fn, ms }), timerId),
    clearTimeout: (id: number) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
    ResizeObserver: class { observe() {} },
    URLSearchParams,
    JSON, Promise, Map, Set, Math, Number, String, Date, Error, Array, Object, RegExp,
    ...opts.globals,
  };
  win.window = win;
  win.addEventListener = (type: string, fn: (e: unknown) => unknown) => listeners.set(type, [...(listeners.get(type) ?? []), fn]);
  win.parent = { postMessage() {} };
  vm.createContext(win);
  vm.runInContext(source, win);
  const settle = async () => {
    for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
  };
  const page: Page = {
    win,
    el,
    settle,
    timers,
    tick: async () => {
      const due = timers.splice(0);
      for (const t of due) t.fn();
      await settle();
    },
  };
  // A message from the host, as the window's message listeners see it.
  win.dispatchMessage = async (data: unknown, extra: Record<string, unknown> = {}) => {
    for (const fn of listeners.get("message") ?? []) await fn({ data, ...extra });
    await settle();
  };
  await settle();
  return page;
}
