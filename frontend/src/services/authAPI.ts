let Base_Url_Auth = 'http://localhost:5000';

if (Base_Url_Auth.endsWith('/')) Base_Url_Auth = Base_Url_Auth.slice(0, -1);

// Request OTP to be sent to email
export async function requestOtp(email: string): Promise<{ message: string }> {
  const response = await fetch(`${Base_Url_Auth}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(`Failed to request OTP: ${response.status}`);
  }
  return response.json();
}

// Verify OTP
export interface VerifyOtpResponse {
  message: string;
  role?: string;
  name?: string;
  department?: string;
}

export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const response = await fetch(`${Base_Url_Auth}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!response.ok) {
    throw new Error(`Failed to verify OTP: ${response.status}`);
  }
  const data = await response.json();
  console.log('role :', data.role, '\n name :', data.name, '\n department :', data.department);
  return data;
}
