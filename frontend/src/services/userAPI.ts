import { getAccessToken } from './authAPI';

export async function fetchUserProfile() {
  const token = getAccessToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch('http://localhost:5000/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}
