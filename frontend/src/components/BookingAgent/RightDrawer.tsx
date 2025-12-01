import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
// import ListItemText from "@mui/material/ListItemText";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
// import CancelIcon from "@mui/icons-material/Cancel";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useTheme } from "../../context/ThemeContext";
import { SwapRequest } from "../../utils/types";

export default function RightDrawer() {
  const [open, setOpen] = React.useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Example data
  const [requests, setRequests] = React.useState<SwapRequest[]>([
    {
      id: 1,
      from: "Alice",
      to: "You",
      message: "Swap shift on Friday?",
      isSender: false,
    },
    {
      id: 2,
      from: "You",
      to: "Bob",
      message: "Swap Saturday morning?",
      isSender: true,
    },
    {
      id: 3,
      from: "Charlie",
      to: "You",
      message: "Swap Tuesday?",
      isSender: false,
    },
  ]);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setOpen(open);
    };

  const handleCancel = (id: number) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  const handleSwap = (id: number) => {
    alert(`Swapped request ID: ${id}`);
    setRequests(requests.filter((req) => req.id !== id));
  };

  const handleReject = (id: number) => {
    alert(`Rejected request ID: ${id}`);
    setRequests(requests.filter((req) => req.id !== id));
  };

  const list = () => (
    <Box
      className="right-drawer-inner"
      sx={{ width: 400, p: 2 }}
      role="presentation"
      onKeyDown={toggleDrawer(false)}
    >
      <Box className="right-drawer-header" mb={2}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* <SwapHorizIcon /> */}
          <Box>
            <Typography variant="h6">Swap Requests</Typography>
            <Typography variant="caption">{requests.length} open</Typography>
          </Box>
        </Box>
        <Button onClick={toggleDrawer(false)} aria-label="Close drawer">
          <CloseIcon />
        </Button>
      </Box>
      <Divider />
      <List className="swap-list">
        {requests.map((req) => (
          <ListItem key={req.id} className="swap-item" divider>
            <div className="meta">
              <div className="name-tag">
                {req.isSender ? `To: ${req.to}` : `From: ${req.from}`}
              </div>
              <div className="primary">{req.message}</div>
            </div>
            <div className="swap-actions">
              {req.isSender ? (
                <IconButton
                  className="swap-icon-btn danger"
                  onClick={() => handleCancel(req.id)}
                  aria-label="Cancel request"
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                <>
                  <IconButton
                    className="swap-icon-btn primary"
                    onClick={() => handleSwap(req.id)}
                    aria-label="Accept swap"
                  >
                    <SwapHorizIcon />
                  </IconButton>
                  <IconButton
                    className="swap-icon-btn danger"
                    onClick={() => handleReject(req.id)}
                    aria-label="Reject request"
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </div>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <div>
      <Button
        variant="contained"
        className="btn-brown"
        startIcon={<SwapHorizIcon />}
        onClick={toggleDrawer(true)}
        sx={{ textTransform: "none", borderRadius: "9999px" }}
      >
        Open Swap Requests
      </Button>
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          className: "right-drawer-paper",
          "data-theme": isDark ? "dark" : "light",
        }}
      >
        {list()}
      </Drawer>
    </div>
  );
}
