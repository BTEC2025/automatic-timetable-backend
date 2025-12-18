'use client';

import { useEffect, useMemo, useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type BodyMode = "json" | "raw";

interface RequestPreset {
  label: string;
  description: string;
  method: HttpMethod;
  path: string;
  body?: string;
  headers?: Record<string, string>;
  bodyMode?: BodyMode;
  requiresAuth?: boolean;
}

interface ResponseDetails {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  headers: Array<{ key: string; value: string }>;
  bodyPreview: string;
  rawBody: string;
}

interface LoginUserSummary {
  id: string;
  username: string;
  role?: string;
  status?: string;
  studentId?: string | null;
  teacherId?: string | null;
}

const METHOD_OPTIONS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const REQUEST_PRESETS: RequestPreset[] = [
  {
    label: "Login (POST /api/auth/login)",
    description: "Use this when you want to test login payloads manually.",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify(
      {
        username: "admin",
        password: "admin123",
      },
      null,
      2,
    ),
    requiresAuth: false,
  },
  {
    label: "Who am I? (GET /api/user)",
    description: "Fetches the profile of whoever owns the current token.",
    method: "GET",
    path: "/api/user",
    requiresAuth: true,
  },
  {
    label: "List departments",
    description: "GET /api/admin/department (supports ?search=).",
    method: "GET",
    path: "/api/admin/department",
    requiresAuth: true,
  },
  {
    label: "Add department",
    description: "POST /api/admin/department with department_name.",
    method: "POST",
    path: "/api/admin/department",
    body: JSON.stringify(
      {
        department_name: "Science and Math",
      },
      null,
      2,
    ),
    requiresAuth: true,
  },
  {
    label: "List users",
    description: "GET /api/admin/user?page=1&limit=10&role=admin.",
    method: "GET",
    path: "/api/admin/user?page=1&limit=10&role=admin",
    requiresAuth: true,
  },
  {
    label: "Create admin user",
    description: "POST /api/admin/user with only username/password/role/status.",
    method: "POST",
    path: "/api/admin/user",
    body: JSON.stringify(
      {
        username: "demo-admin",
        password: "ChangeMe123!",
        role: "admin",
        status: "active",
      },
      null,
      2,
    ),
    requiresAuth: true,
  },
];

const methodSupportsBody = (method: HttpMethod) => method !== "GET";

const tryFormatJson = (text: string) => {
  if (!text.trim()) return "";
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
};

const headersToJson = (headers?: Record<string, string>) =>
  headers ? JSON.stringify(headers, null, 2) : "";

export default function Home() {
  const [detectedOrigin, setDetectedOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDetectedOrigin(window.location.origin);
    }
  }, []);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [lastLoginUser, setLastLoginUser] = useState<LoginUserSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem("btec-auth-token");
    const storedUser = window.localStorage.getItem("btec-auth-user");
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setLastLoginUser(JSON.parse(storedUser));
      } catch {
        setLastLoginUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem("btec-auth-token", token);
    } else {
      window.localStorage.removeItem("btec-auth-token");
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lastLoginUser) {
      window.localStorage.setItem("btec-auth-user", JSON.stringify(lastLoginUser));
    } else {
      window.localStorage.removeItem("btec-auth-user");
    }
  }, [lastLoginUser]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Login failed");
      }
      setToken(data.token || "");
      setLastLoginUser(data.user || null);
      setLoginMessage("Token saved. You can now call protected endpoints.");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const clearToken = () => {
    setToken("");
    setLastLoginUser(null);
  };

  const copyToken = async () => {
    if (!token || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const [method, setMethod] = useState<HttpMethod>("GET");
  const [baseUrl, setBaseUrl] = useState("");
  const [requestPath, setRequestPath] = useState("/api/user");
  const [requestBody, setRequestBody] = useState("");
  const [bodyMode, setBodyMode] = useState<BodyMode>("json");
  const [customHeadersInput, setCustomHeadersInput] = useState("");
  const [includeAuth, setIncludeAuth] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [responseDetails, setResponseDetails] = useState<ResponseDetails | null>(null);
  const [lastRequestMeta, setLastRequestMeta] = useState<{
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    body?: string;
  } | null>(null);

  const requestUrl = useMemo(() => {
    if (requestPath.startsWith("http")) {
      return requestPath;
    }
    const trimmedBase = baseUrl.trim();
    if (trimmedBase) {
      try {
        return new URL(requestPath, trimmedBase).toString();
      } catch {
        return requestPath;
      }
    }
    return requestPath;
  }, [requestPath, baseUrl]);

  const absoluteRequestUrl = useMemo(() => {
    if (requestUrl.startsWith("http")) return requestUrl;
    if (baseUrl.trim()) {
      try {
        return new URL(requestUrl, baseUrl.trim()).toString();
      } catch {
        return requestUrl;
      }
    }
    if (detectedOrigin) {
      try {
        return new URL(requestUrl, detectedOrigin).toString();
      } catch {
        return requestUrl;
      }
    }
    return requestUrl;
  }, [requestUrl, baseUrl, detectedOrigin]);

  const parseHeadersInput = () => {
    if (!customHeadersInput.trim()) {
      return {};
    }
    try {
      const parsed = JSON.parse(customHeadersInput);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Headers must be a JSON object (e.g. {\"X-Id\":\"123\"}).");
      }
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = typeof value === "string" ? value : String(value);
        return acc;
      }, {});
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Invalid JSON format for headers.",
      );
    }
  };

  const sendRequest = async () => {
    setIsRequesting(true);
    setRequestError(null);
    setBodyError(null);
    setTransportError(null);
    setResponseDetails(null);

    let payload: string | undefined;
    if (methodSupportsBody(method) && requestBody.trim()) {
      if (bodyMode === "json") {
        try {
          payload = JSON.stringify(JSON.parse(requestBody));
        } catch {
          setBodyError("Body must be valid JSON when JSON mode is selected.");
          setIsRequesting(false);
          return;
        }
      } else {
        payload = requestBody;
      }
    }

    let headers: Record<string, string>;
    try {
      headers = parseHeadersInput();
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Invalid header input.");
      setIsRequesting(false);
      return;
    }

    if (payload && bodyMode === "json") {
      const hasContentType = Object.keys(headers).some(
        (key) => key.toLowerCase() === "content-type",
      );
      if (!hasContentType) {
        headers["Content-Type"] = "application/json";
      }
    }

    if (includeAuth) {
      if (!token) {
        setRequestError("No token available. Login first or disable Authorization.");
        setIsRequesting(false);
        return;
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const startedAt = performance.now();
      const response = await fetch(requestUrl, {
        method,
        headers,
        body: payload,
      });
      const elapsed = performance.now() - startedAt;
      const rawBody = await response.text();
      setResponseDetails({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        durationMs: Math.round(elapsed),
        headers: Array.from(response.headers.entries()).map(([key, value]) => ({
          key,
          value,
        })),
        bodyPreview: tryFormatJson(rawBody),
        rawBody,
      });
      setLastRequestMeta({
        url: absoluteRequestUrl,
        method,
        headers,
        body: payload,
      });
    } catch (err) {
      setTransportError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsRequesting(false);
    }
  };

  const applyPreset = (preset: RequestPreset) => {
    setMethod(preset.method);
    setRequestPath(preset.path);
    setRequestBody(preset.body ?? "");
    setBodyMode(preset.bodyMode ?? (preset.body ? "json" : "raw"));
    setCustomHeadersInput(headersToJson(preset.headers));
    setIncludeAuth(preset.requiresAuth ?? true);
    setResponseDetails(null);
    setRequestError(null);
    setBodyError(null);
  };

  const lastCurlSnippet = useMemo(() => {
    if (!lastRequestMeta) return "";
    const headerSegment = Object.entries(lastRequestMeta.headers).length
      ? Object.entries(lastRequestMeta.headers)
          .map(([key, value]) => `  -H "${key}: ${value.replace(/"/g, '\\"')}"`)
          .join(" \\\n")
      : "";
    const bodySegment =
      lastRequestMeta.body !== undefined && lastRequestMeta.body !== ""
        ? ` \\\n  --data '${lastRequestMeta.body.replace(/'/g, "'\\''")}'`
        : "";
    const headerBlock = headerSegment ? ` \\\n${headerSegment}` : "";
    return `curl -X ${lastRequestMeta.method} "${lastRequestMeta.url}"${headerBlock}${bodySegment}`;
  }, [lastRequestMeta]);

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Automatic Timetable Backend
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Playground to exercise the backend API
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Use this dashboard to log in, capture a token, and fire requests against any route
            inside{" "}
            <code className="rounded bg-black/40 px-2 py-0.5 text-sm text-cyan-200">
              app/api/*
            </code>{" "}
            without opening Postman or another REST client.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                  Step 1
                </p>
                <h2 className="text-xl font-semibold text-white">Grab a token</h2>
              </div>
              {token ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-200">
                  Login required
                </span>
              )}
            </div>
            <form onSubmit={handleLogin} className="mt-6 grid gap-4">
              <label className="text-sm text-slate-200">
                Username
                <input
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                  placeholder="admin"
                  autoComplete="username"
                />
              </label>
              <label className="text-sm text-slate-200">
                Password
                <input
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                  type="password"
                  placeholder="password"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingIn ? "Logging in..." : "Login & get token"}
              </button>
            </form>
            {loginMessage && (
              <p className="mt-4 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200">
                {loginMessage}
              </p>
            )}
            {loginError && (
              <p className="mt-4 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-200">
                {loginError}
              </p>
            )}
            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold text-slate-100">Token</p>
                {token ? (
                  <button
                    onClick={copyToken}
                    className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-widest text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-200/20"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                ) : (
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    empty
                  </span>
                )}
                {token && (
                  <button
                    onClick={clearToken}
                    className="ml-auto text-xs text-red-300 underline-offset-4 hover:underline"
                  >
                    Clear token
                  </button>
                )}
              </div>
              <div className="rounded-lg bg-slate-950/70 p-3 text-xs text-cyan-100 break-all">
                {token || "No token yet"}
              </div>
            </div>
            {lastLoginUser && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">User info</p>
                <p>ID: {lastLoginUser.id}</p>
                <p>Username: {lastLoginUser.username}</p>
                <p>Role: {lastLoginUser.role}</p>
                <p>Status: {lastLoginUser.status}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/5 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              Quick Presets
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Load a ready-made request
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Click a preset to pre-fill the method, path, and body with a common operation. Adjust anything you need before sending.
            </p>
            <div className="mt-6 grid gap-3">
              {REQUEST_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-left transition hover:border-cyan-400 hover:bg-slate-900/70"
                >
                  <p className="text-sm font-semibold text-white">{preset.label}</p>
                  <p className="text-xs text-slate-300">{preset.description}</p>
                  <div className="mt-2 text-xs font-mono text-cyan-200">
                    {preset.method} {preset.path}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    {preset.requiresAuth === false ? "NO AUTH" : "TOKEN REQUIRED"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-slate-900/80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                  Step 2
                </p>
                <h2 className="text-xl font-semibold text-white">Build your request</h2>
              </div>
              <button
                onClick={sendRequest}
                disabled={isRequesting}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRequesting ? "Sending..." : "Send request"}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm text-slate-200">
                Base URL (optional)
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="http://localhost:3000 (blank uses current origin)"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </label>
              <label className="block text-sm text-slate-200">
                Path or full URL
                <input
                  value={requestPath}
                  onChange={(event) => setRequestPath(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm text-slate-200">
                  Method
                  <select
                    value={method}
                    onChange={(event) => setMethod(event.target.value as HttpMethod)}
                    className="mt-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  >
                    {METHOD_OPTIONS.map((option) => (
                      <option key={option} value={option} className="text-black">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeAuth}
                    onChange={(event) => setIncludeAuth(event.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-cyan-400 focus:ring-cyan-400"
                  />
                  Attach Bearer token automatically
                </label>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Body mode:</span>
                  <button
                    onClick={() => setBodyMode("json")}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      bodyMode === "json"
                        ? "bg-cyan-400/20 text-cyan-200"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setBodyMode("raw")}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      bodyMode === "raw"
                        ? "bg-cyan-400/20 text-cyan-200"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    RAW
                  </button>
                </div>
              </div>
              {methodSupportsBody(method) && (
                <label className="block text-sm text-slate-200">
                  Body
                  <textarea
                    value={requestBody}
                    onChange={(event) => setRequestBody(event.target.value)}
                    rows={8}
                    placeholder={
                      bodyMode === "json"
                        ? '{\n  "department_name": "New name"\n}'
                        : "Plain text / JSON / anything"
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                  />
                </label>
              )}
              <label className="block text-sm text-slate-200">
                Extra headers (JSON object)
                <textarea
                  value={customHeadersInput}
                  onChange={(event) => setCustomHeadersInput(event.target.value)}
                  rows={4}
                  placeholder='{"X-Request-ID": "demo"}'
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </label>
              {requestError && (
                <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {requestError}
                </p>
              )}
              {bodyError && (
                <p className="rounded-lg bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
                  {bodyError}
                </p>
              )}
              {transportError && (
                <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {transportError}
                </p>
              )}
              <p className="text-xs text-slate-400">
                Final URL:
                <span className="ml-1 font-mono text-cyan-200">{absoluteRequestUrl}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                  Step 3
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Inspect the response / copy curl
                </h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-white">Response</p>
                {responseDetails ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-3 text-slate-200">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          responseDetails.ok
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-red-500/20 text-red-200"
                        }`}
                      >
                        {responseDetails.status} {responseDetails.statusText}
                      </span>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {responseDetails.durationMs}ms
                      </span>
                    </div>
                    <details className="rounded border border-white/5 bg-black/30 p-3">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-slate-400">
                        headers
                      </summary>
                      <ul className="mt-2 space-y-1 font-mono text-xs text-slate-200">
                        {responseDetails.headers.map((header) => (
                          <li key={header.key}>
                            <span className="text-slate-500">{header.key}:</span>{" "}
                            {header.value}
                          </li>
                        ))}
                      </ul>
                    </details>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        body
                      </p>
                      <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-white">
                        {responseDetails.bodyPreview || "-"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    Hit Send to see the response here.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm font-semibold text-white">curl (last request)</p>
                {lastCurlSnippet ? (
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-cyan-100">
                    {lastCurlSnippet}
                  </pre>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No request yet</p>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-slate-200">
                <p className="font-semibold text-white">Tips</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Routes under <code>app/api/admin/*</code> require an admin role token.
                  </li>
                  <li>
                    If your backend runs on another port, fill Base URL with something like{" "}
                    <span className="font-mono text-cyan-200">
                      http://localhost:3001
                    </span>
                  </li>
                  <li>Raw mode skips JSON validation so you can relay any payload.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
