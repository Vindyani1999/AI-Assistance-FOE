import "./AuthForm.mui.css";
import React from "react";
import { Formik, Form, FormikHelpers } from "formik";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LoginIcon from "@mui/icons-material/Login";
import { login } from "../../services/authAPI";
import { useNotification } from "../../context/NotificationContext";
import { LoginFormValues } from "../../utils/types";
import { Typography, FormControl, Grid, Select, MenuItem } from "@mui/material";
import { EMAIL_DOMAINS } from "../../utils/CONSTANTS";

const initialValues: LoginFormValues = {
  emailFront: "",
  emailDomain: "",
  password: "",
};

interface LoginFormProps {
  onSwitchToSignup?: () => void;
  onAuthSuccess?: (userSession: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onAuthSuccess,
}) => {
  const { notify } = useNotification();

  const validate = (values: LoginFormValues) => {
    const errors: Partial<Record<keyof LoginFormValues, string>> = {};
    if (!values.emailFront) errors.emailFront = "Required";
    if (!values.emailDomain) errors.emailDomain = "Required";
    if (!values.password) errors.password = "Required";
    return errors;
  };

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (
          values,
          { setSubmitting }: FormikHelpers<LoginFormValues>
        ) => {
          const email = values.emailFront + values.emailDomain;
          try {
            const data = await login(email, values.password);
            notify("success", "Login successful!");
            if (onAuthSuccess) {
              onAuthSuccess(data);
            }
            // Optionally redirect or do other actions here
          } catch (err: any) {
            notify("error", "Login failed", err.message);
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
        }) => (
          <Form>
            <Box
              className="mui-auth-form-box"
              sx={{
                maxWidth: 600,
                mx: "auto",
                p: 3,
                // bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
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
                    //   background: theme === 'dark' ? '#222' : '#fff',
                    p: 0.5,
                  }}
                />
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  className="auth-form-title"
                >
                  Welcome back!
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
                        //   handleEmailChange(e);
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
                            //   handleEmailChange(e as any);
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
                }}
                required
                margin="normal"
                size="small"
                fullWidth
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                className="mui-auth-form-submit"
                sx={{ mt: 3 }}
                endIcon={<LoginIcon />}
                disabled={isSubmitting}
              >
                Login
              </Button>
              <div className="auth-form-switch-text" style={{ marginTop: 16 }}>
                Still don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
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
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default LoginForm;
