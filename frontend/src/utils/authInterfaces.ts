export interface SignupPayload {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
  role: string;
  department: string;
}

export interface VerifyOtpResponse {
  message: string;
  role?: string;
  name?: string;
  department?: string;
}
