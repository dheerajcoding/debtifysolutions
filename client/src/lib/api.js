// Thin wrapper around the Express API. Cookies carry the session; the custom header is
// required by the server on every state-changing call (CSRF protection).
async function req(method, url, body) {
  const res = await fetch("/api" + url, {
    method,
    credentials: "same-origin",
    headers: { "X-Requested-With": "debtify", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    err.field = data.details?.field;
    throw err;
  }
  return data;
}

export const api = {
  meta: () => req("GET", "/meta"),
  registry: (lang) => req("GET", `/public/registry?lang=${lang}`),
  states: () => req("GET", "/public/states"),
  // auth
  me: () => req("GET", "/auth/me"),
  login: (b) => req("POST", "/auth/login", b),
  logout: () => req("POST", "/auth/logout", {}),
  forgot: (email) => req("POST", "/auth/forgot-password", { email }),
  reset: (token, password) => req("POST", "/auth/reset-password", { token, password }),
  // application flow
  currentLead: () => req("GET", "/leads/current"),
  createLead: (b) => req("POST", "/leads", b),
  contact: (id, b) => req("POST", `/leads/${id}/contact`, b),
  patchLead: (id, b) => req("PATCH", `/leads/${id}`, b),
  otpSend: (id, b = {}) => req("POST", `/leads/${id}/otp/send`, b),
  otpVerify: (id, code) => req("POST", `/leads/${id}/otp/verify`, { code }),
  identity: (id, b) => req("POST", `/leads/${id}/identity`, b),
  debts: (id, b) => req("PUT", `/leads/${id}/debts`, b),
  budget: (id, b) => req("POST", `/leads/${id}/budget`, b),
  acknowledge: (id, b) => req("POST", `/leads/${id}/acknowledge`, b),
  comprehension: (id, answers) => req("POST", `/leads/${id}/comprehension`, { answers }),
  risks: (id, b) => req("POST", `/leads/${id}/risks`, b),
  linkDeposits: (id) => req("POST", `/leads/${id}/deposits`, {}),
  enroll: (id, b) => req("POST", `/leads/${id}/enroll`, b),
  call: (id, slot = "now") => req("POST", `/leads/${id}/call`, { slot }),
  person: (id) => req("POST", `/leads/${id}/person`, {}),
  abandon: (id) => req("POST", `/leads/${id}/abandon`, {}),
  chat: (b) => req("POST", "/chat", b),
  // customer dashboard
  application: () => req("GET", "/me/application"),
  cancelProgram: (reason) => req("POST", "/me/application/cancel", { reason }),
  preferences: (b) => req("PATCH", "/me/preferences", b),
  deleteMe: (confirm) => req("DELETE", "/me", { confirm }),
  // staff
  stats: (samples) => req("GET", `/admin/stats?samples=${samples ? 1 : 0}`),
  adminLeads: (f = {}) => req("GET", `/admin/leads?${new URLSearchParams(f)}`),
  adminLead: (id) => req("GET", `/admin/leads/${id}`),
  editLead: (id, patch) => req("PATCH", `/admin/leads/${id}`, patch),
  panel: () => req("GET", "/admin/panel"),
  seedSamples: () => req("POST", "/admin/seed"),
  purgeSamples: () => req("DELETE", "/admin/seed"),
  savePanel: (patch) => req("PATCH", "/admin/panel", patch),
  backendEvent: (id, type) => req("POST", `/admin/leads/${id}/backend-event`, { type }),
  callResult: (id, passed, note) => req("POST", `/admin/leads/${id}/call-result`, { passed, note }),
  adminConsents: (q = {}) => req("GET", `/admin/consents?${new URLSearchParams(q)}`),
  adminDisclosures: () => req("GET", "/admin/disclosures"),
  suppressions: () => req("GET", "/admin/suppressions"),
  addSuppression: (phone, note) => req("POST", "/admin/suppressions", { phone, note }),
  testRevocation: (body) => req("POST", "/admin/suppressions/test-message", { body }),
  providers: () => req("GET", "/admin/providers"),
  dropoffs: (samples) => req("GET", `/admin/dropoffs?samples=${samples ? 1 : 0}`),
  accessLog: () => req("GET", "/admin/access-log"),
  resolve: (id) => req("POST", `/admin/leads/${id}/resolve`, {}),
  users: () => req("GET", "/admin/users"),
  setRole: (id, role) => req("PATCH", `/admin/users/${id}`, { role }),
  outbox: () => req("GET", "/dev/outbox"),
};
