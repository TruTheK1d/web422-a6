// lib/authenticate.js

const TOKEN_KEY = 'jwt_token';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function readToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  const payload = readToken();
  if (!payload) return false;

  // Optional: check exp (expiry) if included in token
  const now = Date.now() / 1000;
  return !payload.exp || payload.exp > now;
}

export async function authenticateUser(userName, password) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });

  if (response.ok) {
    const json = await response.json();
    setToken(json.token);
    return true;
  } else {
    return false;
  }
}

// New function to register a user
export async function registerUser(userName, password, password2) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password, password2 }),
  });

  if (response.ok) {
    // Do NOT set token on registration success
    return true;
  } else {
    return false;
  }
}
