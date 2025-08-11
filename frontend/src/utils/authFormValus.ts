export interface AuthFormValues {
  emailFront: string;
  emailDomain: string;
  password: string;
  confirmPassword: string;
  title: string;
  department: string;
  firstName: string;
  lastName: string;
}

export interface LoginFormValues{
  emailFront: string;
  emailDomain: string;
  password: string;
}
export interface AuthFormProps {
    mode: "login" | "signup";
    onSubmit: (data: { email: string; password: string }) => void;
    buttonText?: string;
    theme?: "light" | "dark" | string;
    onSwitchToLogin?: () => void;
}