import React, { useState, useEffect } from "react";
import AuthForm from "./AuthForm";
import OTPPopup from "./OTPPopup";
import { requestOtp, verifyOtp } from "../../services/authAPI";
import "./OTPPopup.css";

interface AuthPageProps {
  onAuthSuccess: (userSession: any) => void;
  theme?: "light" | "dark" | string;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, theme }) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [otpPopupOpen, setOtpPopupOpen] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Timer effect for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (otpPopupOpen && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => interval && clearInterval(interval);
  }, [otpPopupOpen, otpTimer]);

  // Email validation (faculty)
  const validateEmail = (email: string): boolean => {
    const facultyEmailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.(edu|ac\.lk|ac\.uk|university\.edu|ruh\.ac\.lk|engug\.ruh\.ac\.lk)$/;
    return facultyEmailRegex.test(email);
  };

  // Email/OTP request handler
  const handleEmailSubmit = async ({ email }: { email: string }) => {
    if (!validateEmail(email)) {
      alert("Please enter a valid faculty email address");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestOtp(email);
      setEmail(email);
      setOtp("");
      setOtpError("");
      setOtpTimer(300);
      setOtpPopupOpen(true);
      setStep("email"); // keep on email step, popup handles OTP
      alert(`OTP sent to ${email}! Please check your email inbox.`);
    } catch (error) {
      alert("Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP handler
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpTimer === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }
    setIsSubmitting(true);
    try {
      const userSession = await verifyOtp(email, otp);
      localStorage.setItem("auth_token", `auth_token_faculty_${Date.now()}`);
      localStorage.setItem("user_session", JSON.stringify({
        user: {
          id: '123',
          name: email.split('@')[0],
          email: email,
          provider: 'faculty',
          ...userSession
        },
        loginTime: new Date().toISOString()
      }));
      onAuthSuccess({
        user: {
          id: '123',
          name: email.split('@')[0],
          email: email,
          provider: 'faculty',
          ...userSession
        },
        loginTime: new Date().toISOString()
      });
      setOtpPopupOpen(false);
    } catch (error) {
      setOtpError("OTP verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpClose = () => {
    setOtpPopupOpen(false);
    setOtp("");
    setOtpError("");
  };

  const handleOtpResend = async () => {
    if (!email) return;
    setIsSubmitting(true);
    try {
      await requestOtp(email);
      setOtp("");
      setOtpError("");
      setOtpTimer(300);
      alert(`OTP resent to ${email}`);
    } catch (error) {
      setOtpError("Failed to resend OTP. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page" style={{ margin: "0 auto", padding: 24 }}>
      <AuthForm
        mode="signup"
        onSubmit={({ email }) => handleEmailSubmit({ email })}
        buttonText="Send OTP"
        theme={theme}
      />
      <OTPPopup
        open={otpPopupOpen}
        email={email}
        timer={otpTimer}
        otp={otp}
        error={otpError}
        onChange={setOtp}
        onSubmit={handleOtpSubmit}
        onClose={handleOtpClose}
        onResend={handleOtpResend}
      />
    </div>
  );
};

export default AuthPage;
