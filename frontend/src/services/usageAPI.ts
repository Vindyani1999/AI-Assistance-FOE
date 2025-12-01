import { getAccessToken } from "./authAPI";
import { Auth_Base_URL } from "../App";

export async function getMonthlyLoginDates(
  year: number,
  month: number
): Promise<{ [date: string]: boolean }> {
  const token = getAccessToken();
  const url = `${Auth_Base_URL}/auth/analytics/usage?year=${year}&month=${month}`;

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
