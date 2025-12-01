/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Formik, Form, FormikHelpers } from "formik";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import LoginIcon from "@mui/icons-material/Login";
import "./AuthForm.mui.css";
import { signup, verifyOtp, requestOtp, login } from "../../services/authAPI";
import OTPPopup from "./OTPPopup";
import { useNotification } from "../../context/NotificationContext";
import { AuthFormValues, AuthFormProps } from "../../utils/types";
import {
  EMAIL_DOMAINS,
  ALL_DEPARTMENTS,
  TITLE_OPTIONS,
} from "../../utils/CONSTANTS";

const AuthForm = (props: AuthFormProps) => {
  const { notify } = useNotification();
  const { mode, onSubmit, buttonText, theme, onSwitchToLogin } = props;
  const passwordRequirements = [
    {
      label: "Lowercase letter",
      test: (pw: string) => /[a-z]/.test(pw),
    },
    {
      label: "One number",
      test: (pw: string) => /[0-9]/.test(pw),
    },
    {
      label: "Uppercase letter",
      test: (pw: string) => /[A-Z]/.test(pw),
    },
    {
      label: "Special character",
      test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
    },
    {
      label: "8 characters minimum",
      test: (pw: string) => pw.length >= 8,
    },
  ];

  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [localMode, setLocalMode] = React.useState<"login" | "signup">(mode);
  const effectiveMode = localMode;

  const [otpPopupOpen, setOtpPopupOpen] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [timer, setTimer] = React.useState(300); // 5 minutes in seconds
  const [emailForOtp, setEmailForOtp] = React.useState("");
  const [signupPayload, setSignupPayload] = React.useState<any>(null); // Store signup data until OTP is verified

  const getDomain = (emailFront: string, emailDomain: string) => {
    let domain = emailDomain.startsWith("@")
      ? emailDomain.slice(1)
      : emailDomain;
    if (emailFront && emailFront.includes("@")) {
      const parts = emailFront.split("@");
      domain = parts[1];
    }
    return domain;
  };

  const [showTitle, setShowTitle] = React.useState(false);
  const [dynamicTitleOptions] = React.useState(TITLE_OPTIONS);
  const [dynamicDepartmentOptions] = React.useState(ALL_DEPARTMENTS);
  const [showNameFields, setShowNameFields] = React.useState(false);
  const [showDepartment, setShowDepartment] = React.useState(false);

  // Update dynamic options on email change
  const handleEmailChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | React.ChangeEvent<{ value: unknown; name?: string }>
  ) => {
    const { name, value } = e.target as HTMLInputElement & { name?: string };
    let emailFront = name === "emailFront" ? value : "";
    let emailDomain = name === "emailDomain" ? value : "";
    // Try to get from form values if not changed
    if (!emailFront)
      emailFront =
        (document.getElementsByName("emailFront")[0] as HTMLInputElement)
          ?.value || "";
    if (!emailDomain)
      emailDomain =
        (document.getElementsByName("emailDomain")[0] as HTMLInputElement)
          ?.value || "";
    const domain = getDomain(emailFront, emailDomain);

    // Hide all fields if no domain selected
    if (!domain) {
      setShowTitle(false);
      setShowDepartment(false);
      setShowNameFields(false);
      return;
    }

    // engug.ruh.ac.lk: only department, no title, no name fields
    if (domain === "engug.ruh.ac.lk") {
      setShowTitle(false);
      setShowDepartment(true);
      setShowNameFields(false);
    } else {
      setShowTitle(true);
      setShowDepartment(false);
      setShowNameFields(true);
    }
  };

  const initialValues: AuthFormValues = {
    emailFront: "",
    emailDomain: "",
    password: "",
    confirmPassword: "",
    title: "",
    department: "",
    firstName: "",
    lastName: "",
  };

  const validate = (values: AuthFormValues) => {
    const errors: Partial<Record<keyof AuthFormValues, string>> = {};
    if (!values.emailFront) errors.emailFront = "Required";
    if (!values.password) errors.password = "Required";
    if (effectiveMode === "signup") {
      if (!values.confirmPassword) errors.confirmPassword = "Required";
      if (values.password !== values.confirmPassword)
        errors.confirmPassword = "Passwords do not match";
      if (showTitle && !values.title) errors.title = "Required";
      if (showDepartment && !values.department) errors.department = "Required";
      if (showNameFields) {
        if (!values.firstName) errors.firstName = "Required";
        if (!values.lastName) errors.lastName = "Required";
      }
    }
    return errors;
  };

  // OTP timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (otpPopupOpen && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => interval && clearInterval(interval);
  }, [otpPopupOpen, timer]);

  // Handler for OTP submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    try {
      const data = await verifyOtp(emailForOtp, otp);
      setOtpPopupOpen(false);
      setOtp("");
      setTimer(300);

      notify("success", "OTP verified successfully!");
      // After OTP is verified, send signup payload
      if (signupPayload) {
        try {
          await signup(signupPayload);
          notify("success", "Signup successful!");
          setSignupPayload(null);
        } catch (err: any) {
          notify("error", "Signup failed", err.message);
        }
      }
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP");
      notify("error", "Invalid OTP", err.message);
    }
  };

  // Handler for opening OTP popup after requesting OTP
  const handleOpenOtpPopup = (email: string) => {
    setEmailForOtp(email);
    setOtpPopupOpen(true);
    setTimer(300);
    setOtp("");
    setOtpError("");
  };

  return (
    <Box>
      {/* TEMP: Remove this button after testing
      <Button variant="contained" color="success" onClick={() => notify('success', 'Success!', 'This is a test success message!')}
        style={{ marginBottom: 16 }}>
        Show Success Popup (Test)
      </Button>
      <Button variant="contained" color="error" onClick={() => notify('error', 'Error!', 'This is a test error message!')}
        style={{ marginBottom: 16 }}>
        Show Error Popup (Test)
      </Button>
      <Button variant="contained" color="info" onClick={() => notify('info', 'Info!', 'This is a test info message!')}
        style={{ marginBottom: 16 }}>
        Show Info Popup (Test)
      </Button>
      <Button variant="contained" color="warning" onClick={() => notify('warning', 'Warning!', 'This is a test warning message!')}
        style={{ marginBottom: 16 }}>
        Show Warning Popup (Test)
      </Button> */}
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (
          values: AuthFormValues,
          { setSubmitting }: FormikHelpers<AuthFormValues>
        ) => {
          const email = values.emailFront + values.emailDomain;
          if (effectiveMode === "signup") {
            // Prepare payload for signup
            const payload = {
              email,
              password: values.password,
              firstname: values.firstName,
              lastname: values.lastName,
              title: values.title,
              department: values.department,
            };
            try {
              // 1. Request OTP first
              await requestOtp(email);
              // 2. Store signup payload for after OTP verification
              setSignupPayload(payload);
              handleOpenOtpPopup(email);
            } catch (err: any) {
              notify("error", "Failed to send OTP", err.message);
            }
          } else if (effectiveMode === "login") {
            try {
              const result = await login(email, values.password);
              notify("success", "Login successful!");
              if (typeof onSubmit === "function") {
                onSubmit({ email, password: values.password });
              }
            } catch (err: any) {
              notify("error", "Login failed", err.message);
            }
          }
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
        }: {
          values: AuthFormValues;
          errors: Partial<Record<keyof AuthFormValues, string>>;
          touched: Partial<Record<keyof AuthFormValues, boolean>>;
          handleChange: React.ChangeEventHandler<
            HTMLInputElement | HTMLTextAreaElement
          > &
            ((e: React.ChangeEvent<any>) => void);
          handleBlur: React.FocusEventHandler<
            HTMLInputElement | HTMLTextAreaElement
          > &
            ((e: React.FocusEvent<any>) => void);
          isSubmitting: boolean;
        }) => (
          <Form>
            <Box
              className="mui-auth-form-box"
              sx={{
                maxWidth: 600,
                mx: "auto",
                p: 3,
                bgcolor: theme === "dark" ? "grey.900" : "background.paper",
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              {/* Logo at the top */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Logo"
                  sx={{
                    width: 60,
                    objectFit: "contain",
                    marginBottom: 2,
                    boxShadow:
                      "0 4px 16px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.12)",
                    //   borderRadius: '12px',
                    background: theme === "dark" ? "#222" : "#fff",
                    p: 0.5,
                  }}
                />
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  className="auth-form-title"
                >
                  {effectiveMode === "signup"
                    ? "Get started with your account"
                    : "Welcome back!"}
                </Typography>
              </div>

              <FormControl
                fullWidth
                margin="normal"
                className={`mui-email-row${
                  (touched.emailFront && errors.emailFront) ||
                  (touched.emailDomain && errors.emailDomain)
                    ? " mui-email-row-error"
                    : ""
                }`}
              >
                <Grid container spacing={0} alignItems="center">
                  <Grid size={7}>
                    <TextField
                      id="emailFront"
                      name="emailFront"
                      variant="outlined"
                      value={values.emailFront}
                      label="University Email"
                      onChange={(e) => {
                        handleChange(e);
                        handleEmailChange(e);
                      }}
                      onBlur={handleBlur}
                      required
                      size="small"
                      fullWidth
                      error={touched.emailFront && Boolean(errors.emailFront)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={5}>
                    <Box className="mui-email-domain">
                      <FormControl
                        fullWidth
                        size="small"
                        error={
                          touched.emailDomain && Boolean(errors.emailDomain)
                        }
                      >
                        <Select
                          id="emailDomain"
                          name="emailDomain"
                          value={values.emailDomain}
                          onChange={(e) => {
                            (handleChange as any)(e);
                            handleEmailChange(e as any);
                          }}
                          onBlur={handleBlur}
                          required
                          displayEmpty
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0,
                            },
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select Email Domain
                          </MenuItem>
                          {EMAIL_DOMAINS.filter((domain) => domain).map(
                            (domain) => (
                              <MenuItem key={domain} value={domain}>
                                {domain}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                </Grid>
              </FormControl>
              {/* Show email errors below the email row */}
              {(touched.emailFront && errors.emailFront) ||
              (touched.emailDomain && errors.emailDomain) ? (
                <Typography
                  color="error"
                  sx={{ mt: 0.5, mb: 1, fontSize: "0.75rem" }}
                  className="auth-error"
                >
                  {touched.emailFront && errors.emailFront
                    ? errors.emailFront
                    : ""}
                  {touched.emailDomain && errors.emailDomain
                    ? (touched.emailFront && errors.emailFront ? " | " : "") +
                      errors.emailDomain
                    : ""}
                </Typography>
              ) : null}

              {effectiveMode === "signup" && (
                <>
                  <Grid container spacing={2}>
                    {showTitle && (
                      <Grid size={6}>
                        <FormControl fullWidth margin="normal" size="small">
                          <InputLabel id="title-label">Title</InputLabel>
                          <Select
                            labelId="title-label"
                            id="title"
                            name="title"
                            value={values.title}
                            onChange={handleChange as any}
                            onBlur={handleBlur}
                            required
                            label="Title"
                            error={touched.title && Boolean(errors.title)}
                          >
                            {dynamicTitleOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.title && errors.title && (
                            <Typography
                              variant="caption"
                              color="error"
                              className="auth-error"
                            >
                              {errors.title}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                    )}
                    {showDepartment && (
                      <Grid size={6}>
                        <FormControl fullWidth margin="normal" size="small">
                          <InputLabel id="department-label">
                            Department
                          </InputLabel>
                          <Select
                            labelId="department-label"
                            id="department"
                            name="department"
                            value={values.department}
                            onChange={handleChange as any}
                            onBlur={handleBlur}
                            required
                            label="Department"
                            error={
                              touched.department && Boolean(errors.department)
                            }
                          >
                            <MenuItem value="">Select Department</MenuItem>
                            {dynamicDepartmentOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.department && errors.department && (
                            <Typography
                              variant="caption"
                              color="error"
                              className="auth-error"
                            >
                              {errors.department}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                  {showNameFields && (
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <TextField
                          id="firstName"
                          name="firstName"
                          label="First Name"
                          variant="outlined"
                          value={values.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          margin="normal"
                          size="small"
                          fullWidth
                          error={touched.firstName && Boolean(errors.firstName)}
                          helperText={touched.firstName && errors.firstName}
                          disabled={!showNameFields}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          id="lastName"
                          name="lastName"
                          label="Last Name"
                          variant="outlined"
                          value={values.lastName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          margin="normal"
                          size="small"
                          fullWidth
                          error={touched.lastName && Boolean(errors.lastName)}
                          helperText={touched.lastName && errors.lastName}
                          disabled={!showNameFields}
                        />
                      </Grid>
                    </Grid>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <TextField
                        id="password"
                        name="password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={(e) => {
                          handleBlur(e);
                          setPasswordFocused(false);
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        required
                        margin="normal"
                        size="small"
                        fullWidth
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                      />
                      {/* Password requirements checklist */}
                      <Box sx={{ mt: 1, mb: 1, ml: 0.5 }}>
                        <Grid container spacing={0.5}>
                          {/* First line: first two requirements */}
                          <Grid
                            size={12}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {[0, 1].map((idx) => {
                              const req = passwordRequirements[idx];
                              let icon = (
                                <RadioButtonUncheckedIcon
                                  sx={{
                                    color: "#bdbdbd",
                                    fontSize: 18,
                                    verticalAlign: "middle",
                                  }}
                                />
                              );
                              if (passwordFocused || values.password) {
                                icon = req.test(values.password) ? (
                                  <CheckCircleIcon
                                    sx={{
                                      color: "success.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                ) : (
                                  <CancelIcon
                                    sx={{
                                      color: "error.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                );
                              }
                              return (
                                <span
                                  key={req.label}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    minWidth: 0,
                                  }}
                                >
                                  {icon}
                                  <Typography
                                    component="span"
                                    sx={{
                                      ml: 1,
                                      fontSize: "0.75em",
                                      color:
                                        (passwordFocused || values.password) &&
                                        req.test(values.password)
                                          ? "success.main"
                                          : "#555",
                                    }}
                                  >
                                    {req.label}
                                  </Typography>
                                </span>
                              );
                            })}
                          </Grid>
                          {/* Second line: next two requirements */}
                          <Grid
                            size={12}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {[2, 3].map((idx) => {
                              const req = passwordRequirements[idx];
                              let icon = (
                                <RadioButtonUncheckedIcon
                                  sx={{
                                    color: "#bdbdbd",
                                    fontSize: 18,
                                    verticalAlign: "middle",
                                  }}
                                />
                              );
                              if (passwordFocused || values.password) {
                                icon = req.test(values.password) ? (
                                  <CheckCircleIcon
                                    sx={{
                                      color: "success.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                ) : (
                                  <CancelIcon
                                    sx={{
                                      color: "error.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                );
                              }
                              return (
                                <span
                                  key={req.label}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    minWidth: 0,
                                  }}
                                >
                                  {icon}
                                  <Typography
                                    component="span"
                                    sx={{
                                      ml: 1,
                                      fontSize: "0.75em",
                                      color:
                                        (passwordFocused || values.password) &&
                                        req.test(values.password)
                                          ? "success.main"
                                          : "#555",
                                    }}
                                  >
                                    {req.label}
                                  </Typography>
                                </span>
                              );
                            })}
                          </Grid>
                          {/* Third line: last requirement */}
                          <Grid
                            size={12}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {(() => {
                              const req = passwordRequirements[4];
                              let icon = (
                                <RadioButtonUncheckedIcon
                                  sx={{
                                    color: "#bdbdbd",
                                    fontSize: 18,
                                    verticalAlign: "middle",
                                  }}
                                />
                              );
                              if (passwordFocused || values.password) {
                                icon = req.test(values.password) ? (
                                  <CheckCircleIcon
                                    sx={{
                                      color: "success.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                ) : (
                                  <CancelIcon
                                    sx={{
                                      color: "error.main",
                                      fontSize: 12,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                );
                              }
                              return (
                                <span
                                  key={req.label}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    minWidth: 0,
                                  }}
                                >
                                  {icon}
                                  <Typography
                                    component="span"
                                    sx={{
                                      ml: 1,
                                      fontSize: "0.75em",
                                      color:
                                        (passwordFocused || values.password) &&
                                        req.test(values.password)
                                          ? "success.main"
                                          : "#555",
                                    }}
                                  >
                                    {req.label}
                                  </Typography>
                                </span>
                              );
                            })()}
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        variant="outlined"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        margin="normal"
                        size="small"
                        fullWidth
                        error={
                          touched.confirmPassword &&
                          Boolean(errors.confirmPassword)
                        }
                        helperText={
                          touched.confirmPassword && errors.confirmPassword
                        }
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {effectiveMode === "login" && (
                <TextField
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  margin="normal"
                  size="small"
                  fullWidth
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                className="mui-auth-form-submit"
                sx={{ mt: 3 }}
                endIcon={
                  effectiveMode === "signup" ? <SendIcon /> : <LoginIcon />
                }
                disabled={isSubmitting}
              >
                {buttonText &&
                ((effectiveMode === "signup" &&
                  buttonText.toLowerCase().includes("otp")) ||
                  (effectiveMode === "login" &&
                    buttonText.toLowerCase().includes("login")))
                  ? buttonText
                  : effectiveMode === "signup"
                  ? "Send OTP"
                  : "Login"}
              </Button>

              {effectiveMode === "signup" && (
                <div className="auth-form-switch-text">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof onSwitchToLogin === "function") {
                        onSwitchToLogin();
                      } else {
                        setLocalMode("login");
                      }
                    }}
                    className="auth-form-switch-link"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                    }}
                  >
                    Login
                  </button>
                </div>
              )}
              {effectiveMode === "login" && (
                <div className="auth-form-switch-text">
                  Still don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setLocalMode("signup")}
                    className="auth-form-switch-link"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                    }}
                  >
                    Sign up
                  </button>
                </div>
              )}
            </Box>
          </Form>
        )}
      </Formik>
      <OTPPopup
        open={otpPopupOpen}
        email={emailForOtp}
        timer={timer}
        otp={otp}
        error={otpError}
        onChange={setOtp}
        onSubmit={handleOtpSubmit}
        onClose={() => setOtpPopupOpen(false)}
      />
    </Box>
  );
};

export default AuthForm;
