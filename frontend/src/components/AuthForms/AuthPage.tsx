/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { AuthPageProps } from "../../utils/types";

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, theme }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <div>
      {mode === "login" ? (
        <LoginForm
          onSwitchToSignup={() => setMode("signup")}
          onAuthSuccess={onAuthSuccess}
        />
      ) : (
        <SignupForm onSwitchToLogin={() => setMode("login")} />
      )}
    </div>
  );
};

export default AuthPage;
