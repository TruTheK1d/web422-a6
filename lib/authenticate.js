import jwt_decode from "jwt-decode";

const TOKEN_KEY = "access_token";

export function setToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readToken() {
  const token = getToken();
  return token ? jwt_decode(token) : null;
}

export function isAuthenticated() {
  const token = getToken();
  return !!token;
}

export async function authenticateUser(userName, password) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ userName, password }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (res.status === 200 && data.token) {
    setToken(data.token);
    return true;
  } else {
    throw new Error(data.message || "Invalid username or password");
  }
}

export async function registerUser(userName, password, password_confirm) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ userName, password, password2: password_confirm }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (res.status === 200) {
    return true;
  } else {
    throw new Error(data.message || "Registration failed");
  }
}
