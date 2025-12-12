import React from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import OtpInput from "react-otp-input";
import "./OTPPopup.css";
import { OTPPopupProps } from "../../utils/types";

const OTPPopup: React.FC<OTPPopupProps> = ({
  open,
  email,
  timer,
  otp,
  error,
  onChange,
  onSubmit,
  onClose,
  onResend,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      className="otp-popup"
      PaperProps={{
        style: {
          minHeight: 420,
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          position: "relative",
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 12,
          top: 12,
          color: "#888",
          zIndex: 10,
        }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <VerifiedUserIcon
          sx={{
            fontSize: 70,
            color: "#795548",
            background: "#e5d4cd",
            borderRadius: "50%",
            padding: 1.2,
            mb: 1,
            boxShadow: "0 2px 8px #bca18c33",
          }}
        />
      </div>
      <DialogTitle
        className="otp-popup-title"
        sx={{
          textAlign: "center",
          pt: 1,
          pb: 1,
          fontWeight: 900,
          fontSize: "3rem",
          color: "#23272f",
          border: "none",
          background: "none",
        }}
      >
        Verify your code
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 0,
          pb: 0,
        }}
      >
        <div
          className="otp-desc-text"
          style={{
            color: "#6b7280",
            fontSize: "0.8rem",
            marginBottom: "0.2em",
            textAlign: "center",
          }}
        >
          We have sent a code to your email
        </div>
        <div
          className="otp-email-text"
          style={{
            color: "#23272f",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "1.2em",
            textAlign: "center",
          }}
        >
          {email}
        </div>
        <form onSubmit={onSubmit} id="otp-form" style={{ width: "100%" }}>
          <div
            className="otp-input-container"
            style={{ justifyContent: "center", marginBottom: 24 }}
          >
            <OtpInput
              value={otp}
              onChange={onChange}
              numInputs={6}
              inputType="number"
              shouldAutoFocus
              containerStyle="otp-input-container"
              inputStyle="otp-input-box"
              renderInput={(props, index) => <input {...props} key={index} />}
            />
          </div>
          {error && (
            <Typography
              color="error"
              align="center"
              variant="body2"
              sx={{ mb: 1 }}
            >
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            form="otp-form"
            variant="contained"
            fullWidth
            sx={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "8px",
              boxShadow: "0 2px 8px #2563eb22",
              fontSize: "1.08rem",
              textTransform: "none",
              mt: 1.5,
              mb: 1.5,
              "&:hover": { background: "#1d4ed8" },
              "&:disabled": { background: "#b0bec5", color: "#fff" },
            }}
            disabled={timer === 0}
          >
            Verify
          </Button>
        </form>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div
            className="otp-timer"
            style={{
              background: "#f8e7e7",
              color: "#a94442",
              borderRadius: 16,
              fontWeight: 600,
              fontSize: "1.05rem",
              padding: "0.2em 1.1em",
              marginBottom: "0.2em",
              marginTop: "0.2em",
              textAlign: "center",
              letterSpacing: "0.5px",
              width: "fit-content",
            }}
          >
            OTP expires in:{" "}
            {Math.floor(timer / 60) > 0 ? `${Math.floor(timer / 60)}m ` : ""}
            {timer % 60}s
          </div>
          {onResend && (
            <div
              style={{
                fontSize: "0.98rem",
                color: "#6b7280",
                textAlign: "center",
                marginTop: "0.2em",
              }}
            >
              Didn't receive code?{" "}
              <Button
                onClick={onResend}
                size="small"
                sx={{
                  color: "#2563eb",
                  fontWeight: 600,
                  textTransform: "none",
                  minWidth: 0,
                  p: 0,
                  ml: 0.5,
                }}
              >
                Resend
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPPopup;
