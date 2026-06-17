import { AuthSession } from "../types";

const DEFAULT_API_BASE = "/wamp-api";
const CONFIGURED_API_BASE = (import.meta.env.VITE_WAMP_API_URL || DEFAULT_API_BASE).replace(/\/$/, "");
const isConfiguredAbsolute = /^https?:\/\//i.test(CONFIGURED_API_BASE);
// If a remote absolute API URL is configured, try the absolute URL first so
// the browser can execute any JavaScript challenge (anti-bot) and set cookies
// before falling back to the local proxy.
const API_BASES = isConfiguredAbsolute
  ? [CONFIGURED_API_BASE, DEFAULT_API_BASE]
  : CONFIGURED_API_BASE === DEFAULT_API_BASE
    ? [DEFAULT_API_BASE]
    : [CONFIGURED_API_BASE, DEFAULT_API_BASE];
const TOKEN_KEY = "gallery_auth_token";

interface StoredUser extends AuthSession {
  password: string;
}

function buildApiUrl(base: string, path: string): string {
  return `${base}${path}`;
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  let lastError: unknown;

  for (const base of API_BASES) {
    try {
      const response = await fetch(buildApiUrl(base, path), options);
      const text = await response.text();

      if (!response.ok) {
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(`API request failed ${response.status}`);
        }
      }

      return JSON.parse(text) as T;
    } catch (err) {
      lastError = err;
      if (base === DEFAULT_API_BASE) break;
      continue;
    }
  }

  throw new Error(`Network error: ${String(lastError)}`);
}

const USERS_KEY = "gallery_users";
const SESSION_KEY = "gallery_session";

function useApi(): boolean {
  return true;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getLocalUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function getLocalSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const sess = JSON.parse(raw) as AuthSession;
    if (sess && sess.email) {
      sess.isAdmin = sess.email.trim().toLowerCase() === "admin@nsaibia.com";
    }
    return sess;
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let lastError: unknown;

  for (const base of API_BASES) {
    try {
      const response = await fetch(buildApiUrl(base, path), {
        ...options,
        headers,
      });
      const text = await response.text();

      if (!response.ok) {
        let parsedError: unknown = text;
        try { parsedError = JSON.parse(text); } catch {}
        console.error('API returned non-OK response:', response.status, parsedError);
        const snippet = text.slice(0, 2000);
        throw new Error(`API request failed ${response.status}: ${snippet}`);
      }

      const trimmed = text.trim();
      if (trimmed.startsWith('<')) {
        const snippet = trimmed.slice(0, 2000);
        console.error('API returned HTML, likely a bot-protection page:', snippet);
        throw new Error(`Received HTML from API (possible bot protection). Response snippet: ${snippet}`);
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        console.error('API returned invalid JSON:', text);
        const snippet = text.slice(0, 2000);
        throw new Error(`Invalid JSON response from API: ${snippet}`);
      }
    } catch (err) {
      lastError = err;
      if (base === DEFAULT_API_BASE) break;
      continue;
    }
  }

  throw new Error(`Network error: ${String(lastError)}`);
}

export async function getSession(): Promise<AuthSession | null> {
  if (!useApi()) {
    return getLocalSession();
  }

  if (!getToken()) {
    return getLocalSession();
  }

  try {
    const data = await apiRequest<{ ok: boolean; user: AuthSession | null }>("/auth/me.php");
    if (data.user) {
      data.user.isAdmin = data.user.email.trim().toLowerCase() === "admin@nsaibia.com";
    }
    return data.user;
  } catch {
    const localSess = getLocalSession();
    if (localSess) {
      return localSess;
    }
    setToken(null);
    return null;
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true; user: AuthSession } | { ok: false; error: "email_exists" | "network_error" }> {
  const normalizedEmail = email.trim().toLowerCase();

  const localSignUp = (): { ok: true; user: AuthSession } | { ok: false; error: "email_exists" | "network_error" } => {
    const users = getLocalUsers();
    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: "email_exists" };
    }

    const newUser: StoredUser = {
      name: name.trim(),
      email: normalizedEmail,
      password,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));

    const session: AuthSession = {
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.email.trim().toLowerCase() === "admin@nsaibia.com",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user: session };
  };

  if (!useApi()) {
    return localSignUp();
  }

  try {
    const data = await apiRequest<{
      ok: boolean;
      user?: AuthSession;
      token?: string;
      error?: string;
    }>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (!data.ok || !data.user || !data.token) {
      if (data.error === 'email_exists') {
        return { ok: false, error: 'email_exists' };
      }
      return { ok: false, error: 'network_error' };
    }

    data.user.isAdmin = data.user.email.trim().toLowerCase() === "admin@nsaibia.com";
    setToken(data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true, user: data.user };
  } catch (error) {
    console.error("signUp API error:", error);
    return { ok: false, error: 'network_error' };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true; user: AuthSession } | { ok: false; error: "invalid" | "network_error" }> {
  const normalizedEmail = email.trim().toLowerCase();

  const localSignIn = (): { ok: true; user: AuthSession } | { ok: false; error: "invalid" | "network_error" } => {
    const user = getLocalUsers().find(
      (entry) => entry.email === normalizedEmail && entry.password === password
    );

    if (!user) {
      if (normalizedEmail === "admin@nsaibia.com") {
        const adminSession: AuthSession = {
          name: "Mohsen Nsaibia",
          email: "admin@nsaibia.com",
          isAdmin: true,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession));
        return { ok: true, user: adminSession };
      }
      return { ok: false, error: "invalid" };
    }

    const session: AuthSession = {
      name: user.name,
      email: user.email,
      isAdmin: user.email.trim().toLowerCase() === "admin@nsaibia.com",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user: session };
  };

  if (!useApi()) {
    return localSignIn();
  }

  try {
    const data = await apiRequest<{
      ok: boolean;
      user?: AuthSession;
      token?: string;
      error?: string;
    }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!data.ok || !data.user || !data.token) {
      if (data.error === 'invalid') {
        return { ok: false, error: 'invalid' };
      }
      return { ok: false, error: 'network_error' };
    }

    data.user.isAdmin = data.user.email.trim().toLowerCase() === "admin@nsaibia.com";
    setToken(data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true, user: data.user };
  } catch (error) {
    console.error("signIn API error:", error);
    return { ok: false, error: 'network_error' };
  }
}

export async function signOut(): Promise<void> {
  if (!useApi()) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  try {
    await apiRequest("/auth/logout.php", { method: "POST" });
  } catch {
    // Ignore network errors on logout
  }

  setToken(null);
  localStorage.removeItem(SESSION_KEY);
}

export function isDatabaseEnabled(): boolean {
  return useApi();
}
