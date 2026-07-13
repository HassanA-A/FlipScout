// Works in Chrome, Firefox, and Zen (Firefox-based). MV3 in both engines
// exposes promise-based storage/tabs/scripting; Firefox also defines
// `browser`, Chrome only `chrome`.
const ext = globalThis.browser ?? globalThis.chrome;

const els = {
  endpoint: document.getElementById("endpoint"),
  loginSection: document.getElementById("login-section"),
  appSection: document.getElementById("app-section"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  signin: document.getElementById("signin"),
  signout: document.getElementById("signout"),
  whoami: document.getElementById("whoami"),
  go: document.getElementById("go"),
  result: document.getElementById("result"),
};

// ---------- storage helpers ----------

async function loadState() {
  const state = await ext.storage.local.get({
    endpoint: "http://localhost:3000",
    auth: null, // { accessToken, refreshToken, expiresAt, email }
    supa: null, // { url, anonKey } cached per endpoint
  });
  return state;
}

function saveState(patch) {
  return ext.storage.local.set(patch);
}

// Strip trailing slashes so we never fetch `//api/...` (a redirect the
// browser's CORS preflight refuses to follow → opaque NetworkError).
function normalizeEndpoint(value) {
  return (value || "").trim().replace(/\/+$/, "") || "http://localhost:3000";
}

// ---------- supabase auth (REST, no SDK needed) ----------

async function fetchConfig(endpoint) {
  const res = await fetch(`${endpoint}/api/config`);
  if (!res.ok) throw new Error(`Couldn't reach ${endpoint}/api/config (${res.status})`);
  const cfg = await res.json();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error("Server missing Supabase config");
  return { url: cfg.supabaseUrl, anonKey: cfg.supabaseAnonKey };
}

async function getSupaConfig() {
  const endpoint = normalizeEndpoint(els.endpoint.value);
  const state = await loadState();
  if (state.supa?.endpoint === endpoint) return state.supa;
  const cfg = await fetchConfig(endpoint);
  const supa = { ...cfg, endpoint };
  await saveState({ supa });
  return supa;
}

async function signIn(email, password) {
  const supa = await getSupaConfig();
  const res = await fetch(`${supa.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supa.anonKey },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "Sign-in failed");
  }
  const auth = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    email: data.user?.email ?? email,
  };
  await saveState({ auth });
  return auth;
}

async function refreshSession(auth) {
  const supa = await getSupaConfig();

  let res;
  let data;
  try {
    res = await fetch(`${supa.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supa.anonKey },
      body: JSON.stringify({ refresh_token: auth.refreshToken }),
    });
    data = await res.json();
  } catch {
    // Network blip (offline, DNS, etc.) — do NOT sign out. Keep the stored
    // session so the next attempt can succeed once we're back online.
    throw new Error("Couldn't reach the server — check your connection and retry.");
  }

  if (!res.ok) {
    // Only a genuinely invalid/expired refresh token should log the user out.
    const invalid =
      data?.error === "invalid_grant" ||
      /refresh.*token/i.test(data?.error_description || "");
    if (invalid) {
      await saveState({ auth: null });
      throw new Error("Session expired — please sign in again.");
    }
    // Transient server error — keep the session and let them retry.
    throw new Error(data?.error_description || "Temporary sign-in error — please retry.");
  }

  const next = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? auth.refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    email: data.user?.email ?? auth.email,
  };
  await saveState({ auth: next });
  return next;
}

// Returns a valid access token, refreshing if it expires within a minute.
async function ensureToken() {
  const { auth } = await loadState();
  if (!auth) throw new Error("Please sign in first.");
  if (Date.now() > auth.expiresAt - 60_000) {
    return (await refreshSession(auth)).accessToken;
  }
  return auth.accessToken;
}

// ---------- capture + ingest ----------

async function captureActiveTab() {
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");
  const results = await ext.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["capture.js"],
  });
  return results?.[0]?.result;
}

async function ingest(capture) {
  const endpoint = normalizeEndpoint(els.endpoint.value);
  let token = await ensureToken();

  let res = await fetch(`${endpoint}/api/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(capture),
  });

  // One retry after a refresh if the token was stale.
  if (res.status === 401) {
    const { auth } = await loadState();
    if (auth) {
      token = (await refreshSession(auth)).accessToken;
      res = await fetch(`${endpoint}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(capture),
      });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API responded ${res.status}`);
  return data;
}

// ---------- UI ----------

function setText(el, text) {
  el.textContent = text;
}

function renderAnalysis({ analysis, watchlistHits }) {
  els.result.textContent = "";

  const verdict = document.createElement("span");
  verdict.className = analysis.verdict === "pass" ? "pass" : "buy";
  verdict.textContent = `${analysis.verdict.toUpperCase()} · score ${analysis.score}`;
  els.result.appendChild(verdict);

  const lines = [
    `\nEst. value $${analysis.estValue} · profit ${analysis.estProfit >= 0 ? "+" : ""}$${analysis.estProfit}`,
    analysis.reasoning,
    watchlistHits?.length ? `🔔 Watchlist: ${watchlistHits.join(", ")}` : null,
    "Saved to your board.",
  ].filter(Boolean);
  els.result.appendChild(document.createTextNode(lines.join("\n")));
}

async function renderAuthState() {
  const { auth } = await loadState();
  const signedIn = Boolean(auth);
  els.loginSection.classList.toggle("hidden", signedIn);
  els.appSection.classList.toggle("hidden", !signedIn);
  if (signedIn) {
    els.whoami.textContent = "";
    els.whoami.appendChild(document.createTextNode("Signed in as "));
    const b = document.createElement("b");
    b.textContent = auth.email;
    els.whoami.appendChild(b);
  }
}

async function init() {
  const state = await loadState();
  els.endpoint.value = state.endpoint;
  await renderAuthState();
}

els.endpoint.addEventListener("change", async () => {
  const endpoint = normalizeEndpoint(els.endpoint.value);
  els.endpoint.value = endpoint;
  // Endpoint changed → cached Supabase config may be stale.
  await saveState({ endpoint, supa: null });
});

els.signin.addEventListener("click", async () => {
  els.signin.disabled = true;
  setText(els.result, "Signing in…");
  try {
    await signIn(els.email.value.trim(), els.password.value);
    els.password.value = "";
    setText(els.result, "");
    await renderAuthState();
  } catch (err) {
    setText(els.result, `Sign-in failed: ${err.message}`);
  } finally {
    els.signin.disabled = false;
  }
});

els.signout.addEventListener("click", async () => {
  await saveState({ auth: null });
  setText(els.result, "");
  await renderAuthState();
});

els.go.addEventListener("click", async () => {
  els.go.disabled = true;
  setText(els.result, "Capturing page…");

  try {
    const capture = await captureActiveTab();
    if (!capture?.title || capture.price === null) {
      setText(
        els.result,
        "Couldn't find a title/price on this page. Open a specific listing and try again."
      );
      return;
    }

    setText(els.result, `Analyzing "${capture.title}" at $${capture.price}…`);
    const data = await ingest(capture);
    renderAnalysis(data);
  } catch (err) {
    setText(els.result, `Failed: ${err.message}`);
    await renderAuthState();
  } finally {
    els.go.disabled = false;
  }
});

init();
