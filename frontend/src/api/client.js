const API_BASE = import.meta.env.VITE_API_BASE || "";
const CACHE_PREFIX = "service-hub-cache:";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
}

export function readCachedValue(key, maxAgeMs = 0) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(`${CACHE_PREFIX}${key}`);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const isExpired = maxAgeMs > 0 && Date.now() - parsed.savedAt > maxAgeMs;

    if (isExpired) {
      storage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.value ?? null;
  } catch (error) {
    storage.removeItem(`${CACHE_PREFIX}${key}`);
    return null;
  }
}

export function writeCachedValue(key, value) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    `${CACHE_PREFIX}${key}`,
    JSON.stringify({
      savedAt: Date.now(),
      value,
    }),
  );
}

export function clearCachedValue(key) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(`${CACHE_PREFIX}${key}`);
}

export function clearCachedValuesByPrefix(prefix) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const fullPrefix = `${CACHE_PREFIX}${prefix}`;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);

    if (key && key.startsWith(fullPrefix)) {
      storage.removeItem(key);
    }
  }
}

export async function apiRequest(path, options = {}) {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
    ...rest,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
}
