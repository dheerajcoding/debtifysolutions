// Runtime provider/state panel.
//
// The decision engine, the public site and the staff console all read the same
// shared config objects (PROVIDERS, CLOSED_STATES, STATE_FEE_CAPS). Rather than thread
// a config argument through every call site, admin overrides are applied *in place* to
// those objects, so every consumer sees the current panel with no refactor.
//
// The original file values are captured once at import as the baseline, so an override
// can always be cleared back to what ships in the repo.
import { CLOSED_STATES, PROVIDERS, STATE_FEE_CAPS, US_STATES } from "../../../shared/config/providers.js";
import { db } from "../config/db.js";

const KEY = "panel";
const clone = (o) => JSON.parse(JSON.stringify(o));

const BASE = {
  closedStates: clone(CLOSED_STATES),
  feeCaps: clone(STATE_FEE_CAPS),
  licensedStates: Object.fromEntries(PROVIDERS.map((p) => [p.id, clone(p.licensedStates)])),
};

let overrides = { closedStates: null, feeCaps: {}, licensedStates: {} };

const VALID = new Set(US_STATES.map((s) => s.code));
const cleanStates = (arr) => [...new Set((arr || []).map((s) => String(s).toUpperCase()).filter((s) => VALID.has(s)))].sort();

/** Re-apply the current overrides on top of the baseline, mutating the shared config. */
function apply() {
  const closed = overrides.closedStates == null ? BASE.closedStates : cleanStates(overrides.closedStates);
  CLOSED_STATES.length = 0;
  CLOSED_STATES.push(...closed);

  for (const k of Object.keys(STATE_FEE_CAPS)) delete STATE_FEE_CAPS[k];
  Object.assign(STATE_FEE_CAPS, BASE.feeCaps);
  for (const [st, cap] of Object.entries(overrides.feeCaps || {})) {
    const code = String(st).toUpperCase();
    if (!VALID.has(code)) continue;
    if (cap === null) delete STATE_FEE_CAPS[code];
    else if (Number.isFinite(Number(cap))) STATE_FEE_CAPS[code] = Number(cap);
  }

  for (const p of PROVIDERS) {
    const next = overrides.licensedStates?.[p.id];
    const list = next == null ? BASE.licensedStates[p.id] : cleanStates(next);
    p.licensedStates.length = 0;
    p.licensedStates.push(...list);
  }
}

/** Load saved overrides from the database and apply them. Called once at boot. */
export async function loadPanel() {
  try {
    const row = await db.settings.findOne({ key: KEY });
    if (row?.value) overrides = { closedStates: null, feeCaps: {}, licensedStates: {}, ...row.value };
  } catch {
    /* settings are best-effort: a missing store must never stop the server booting */
  }
  apply();
  return currentPanel();
}

/** Persist a partial override patch, apply it, and return the new effective panel. */
export async function savePanel(patch, actor) {
  if (patch.closedStates !== undefined) overrides.closedStates = patch.closedStates === null ? null : cleanStates(patch.closedStates);
  if (patch.feeCaps) overrides.feeCaps = { ...overrides.feeCaps, ...patch.feeCaps };
  if (patch.licensedStates) {
    for (const [id, list] of Object.entries(patch.licensedStates)) {
      if (!PROVIDERS.some((p) => p.id === id)) continue;
      overrides.licensedStates[id] = list === null ? null : cleanStates(list);
    }
  }
  if (patch.reset) overrides = { closedStates: null, feeCaps: {}, licensedStates: {} };
  apply();
  const value = clone(overrides);
  const existing = await db.settings.findOne({ key: KEY });
  if (existing) await db.settings.update(KEY, { value, updatedBy: actor || "" });
  else await db.settings.create({ key: KEY, value, updatedBy: actor || "" });
  return currentPanel();
}

/** The panel as the engine currently sees it, plus what differs from the repo baseline. */
export function currentPanel() {
  const served = US_STATES.map((s) => s.code).filter((c) => !CLOSED_STATES.includes(c) && PROVIDERS.some((p) => p.licensedStates.includes(c)));
  return {
    states: US_STATES.map((s) => ({
      code: s.code,
      name: s.name,
      open: served.includes(s.code),
      closed: CLOSED_STATES.includes(s.code),
      feeCap: STATE_FEE_CAPS[s.code] ?? null,
      providers: PROVIDERS.filter((p) => p.licensedStates.includes(s.code)).map((p) => ({ id: p.id, name: p.displayName })),
    })),
    providers: PROVIDERS.map((p) => ({ id: p.id, name: p.displayName, licensedStates: [...p.licensedStates] })),
    servedCount: served.length,
    customised: {
      closedStates: overrides.closedStates != null,
      feeCaps: Object.keys(overrides.feeCaps || {}).length,
      providers: Object.keys(overrides.licensedStates || {}).length,
    },
  };
}
