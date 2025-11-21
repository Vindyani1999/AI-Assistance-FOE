import { SignupPayload, VerifyOtpResponse } from '../utils/authInterfaces';
let Base_Url_Auth = process.env.REACT_APP_AUTH_URL||'http://localhost:5000';

if (Base_Url_Auth.endsWith('/')) Base_Url_Auth = Base_Url_Auth.slice(0, -1);
if (Base_Url_Auth.endsWith("/")) Base_Url_Auth = Base_Url_Auth.slice(0, -1);

// Login API
// Helper to get the latest access token
export function getAccessToken() {
  return localStorage.getItem("auth_token");
}

// Helper to update access token from response headers (if present)
function updateAccessTokenFromResponse(response: Response) {
  const newToken = response.headers.get("x-access-token");
  if (newToken) {
    localStorage.setItem("auth_token", newToken);
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ message: string; user?: any; accessToken?: string }> {
  const response = await fetch(`${Base_Url_Auth}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  // Store rolling token from response header if present
  updateAccessTokenFromResponse(response);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to login: ${response.status}`);
  }
  const data = await response.json();
  // Store access token from body if present (for backward compatibility)
  if (data.accessToken) {
    localStorage.setItem("auth_token", data.accessToken);
    //   console.log('Access token stored:', data.accessToken);
    //   console.log('role :', data.user.role, '\n name :', data.user.name, '\n department :', data.user.department, '\n id :', data.user.id, '\n');
  }
  return data;
  //data.user.id will give you the user's ID
}

export async function signup(
  payload: SignupPayload
): Promise<{ message: string }> {
  const response = await fetch(`${Base_Url_Auth}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  updateAccessTokenFromResponse(response);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to signup: ${response.status}`);
  }
  return response.json();
}

// Request OTP to be sent to email
export async function requestOtp(email: string): Promise<{ message: string }> {
  const response = await fetch(`${Base_Url_Auth}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // No Authorization header
    body: JSON.stringify({ email }),
  });
  // No need to update access token for OTP request
  if (!response.ok) {
    throw new Error(`Failed to request OTP: ${response.status}`);
  }
  return response.json();
}

// Verify OTP

export async function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  const response = await fetch(`${Base_Url_Auth}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ email, otp }),
  });
  updateAccessTokenFromResponse(response);
  if (!response.ok) {
    throw new Error(`Failed to verify OTP: ${response.status}`);
  }
  const data = await response.json();
  // console.log('role :', data.role, '\n name :', data.name, '\n department :', data.department, '\n id :', data.id, '\n');
  return data;
}
