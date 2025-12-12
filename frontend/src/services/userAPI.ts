import { getAccessToken } from "./authAPI";

export async function fetchUserProfile() {
  const token = getAccessToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(process.env.REACT_APP_AUTH_URL + '/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
}
