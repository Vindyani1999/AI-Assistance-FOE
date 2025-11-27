import { getAccessToken } from "./authAPI";

const DEFAULT_AUTH_BASE = "http://auth-backend:5000";

export async function getMonthlyLoginDates(
  year: number,
  month: number
): Promise<{ [date: string]: boolean }> {
  const AUTH_BASE =
    (process.env.REACT_APP_AUTH_API as string) || DEFAULT_AUTH_BASE;
  const token = getAccessToken();
  const url = `${AUTH_BASE.replace(
    /\/$/,
    ""
  )}/auth/analytics/usage?year=${year}&month=${month}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-access-token": token } : {}),
    },
  });

  const rotated = res.headers.get("x-access-token");
  if (rotated) localStorage.setItem("auth_token", rotated);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch usage: ${res.status}`);
  }

  const data = await res.json();
  return data && typeof data === "object"
    ? (data as { [date: string]: boolean })
    : {};
}
