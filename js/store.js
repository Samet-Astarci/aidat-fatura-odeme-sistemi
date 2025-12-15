const KEY = "aidat_proto_state_v1";

const defaultState = {
  session: null, // { userId, username, role }
  payments: {},  // { [debtId]: { paidAt, method, note } }
  flags: {
    devMode: false, // test empty/error states
    forceLoadError: false,
    forceEmptyLists: false,
    forcePaymentFail: false,
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed, flags: { ...defaultState.flags, ...(parsed.flags || {}) } };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
}

export function setSession(state, session) {
  state.session = session;
  saveState(state);
}

export function clearSession(state) {
  state.session = null;
  saveState(state);
}

export function markPaid(state, debtId, info) {
  state.payments[String(debtId)] = info;
  saveState(state);
}

export function isPaid(state, debtId) {
  return !!state.payments[String(debtId)];
}

export function toggleFlag(state, flagKey) {
  state.flags[flagKey] = !state.flags[flagKey];
  saveState(state);
}

export function setFlag(state, flagKey, value) {
  state.flags[flagKey] = !!value;
  saveState(state);
}
