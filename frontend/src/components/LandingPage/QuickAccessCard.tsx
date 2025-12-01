import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { Card, CardContent, Typography, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router-dom";
import { QuickAccessCardProps } from "../../utils/types";
import CalendarUsageMUI from "./CalendarUsageMUI";

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ agents }) => {
  const navigate = useNavigate();
  const handleAgentClick = (agent: string) => {
    if (agent === "guidance") {
      navigate("/guidance-chat");
    } else if (agent === "booking") {
      navigate("/booking-chat");
    } else if (agent === "planner") {
      navigate("/planner-chat");
    }
  };
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // default ordering and info if no agents provided
  const defaultAgents = [
    { id: "guidance", name: "Guidance Agent" },
    { id: "booking", name: "Booking Agent" },
    { id: "planner", name: "Planner Agent" },
  ];
  const agentsList = agents && agents.length > 0 ? agents : defaultAgents;

  const renderAgentCard = (agent: { id: string; name?: string }) => {
    const id = agent.id;
    if (id === "guidance") {
      return (
        <Card
          key={id}
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 2,
            mb: 1,
            background: isDark ? "#23272f" : "#ffffff",
            color: isDark ? "#eaf3ff" : "#222",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(30,30,30,0.10)",
            "&:hover": {
              boxShadow: isDark
                ? "0 8px 32px rgba(30,30,30,0.28)"
                : "0 8px 32px rgba(90,90,90,0.18)",
            },
          }}
          onClick={() => handleAgentClick("guidance")}
        >
          <Box sx={{ position: "relative", width: 90, height: 90, mb: 1 }}>
            {/* Icon - larger, no bg, with shadow */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 0.1,
                mb: 1,
                zIndex: 2,
                position: "relative",
              }}
            >
              <img
                src="/ga_new.png"
                alt="Agent Icon"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "none",
                  boxShadow: isDark
                    ? "0 3px 12px rgba(176, 141, 87, 0.38)"
                    : "0 3px 12px rgba(30,30,30,0.38)",
                }}
              />
            </Box>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isDark ? "#fff" : "#222",
              textAlign: "center",
            }}
          >
            Guidance Agent
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              opacity: 0.92,
              color: isDark ? "#eaf3ff" : "#666",
              mt: 0.5,
              textAlign: "center",
            }}
          >
            AI guidance to your queries
          </Typography>
        </Card>
      );
    }
    if (id === "booking") {
      return (
        <Card
          key={id}
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 2,
            mb: 1,
            background: isDark ? "#23272f" : "#ffffff",
            color: isDark ? "#eaf3ff" : "#222",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(30,30,30,0.10)",
            "&:hover": {
              boxShadow: isDark
                ? "0 8px 32px rgba(30,30,30,0.28)"
                : "0 8px 32px rgba(90,90,90,0.18)",
            },
          }}
          onClick={() => handleAgentClick("booking")}
        >
          <Box sx={{ position: "relative", width: 90, height: 90, mb: 1 }}>
            <img
              src="/hba_new.png"
              alt="Booking Agent"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "none",
                position: "absolute",
                top: 0,
                left: 0,
                boxShadow: isDark
                  ? "0 3px 12px rgba(176, 141, 87, 0.38)"
                  : "0 3px 12px rgba(30,30,30,0.38)",
              }}
            />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isDark ? "#fff" : "#222",
              textAlign: "center",
            }}
          >
            Booking Agent
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              opacity: 0.92,
              color: isDark ? "#eaf3ff" : "#666",
              mt: 0.5,
              textAlign: "center",
            }}
          >
            AI powered halls booking
          </Typography>
        </Card>
      );
    }
    if (id === "planner") {
      return (
        <Card
          key={id}
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 2,
            background: isDark ? "#23272f" : "#ffffff",
            color: isDark ? "#eaf3ff" : "#222",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(30,30,30,0.10)",
            "&:hover": {
              boxShadow: isDark
                ? "0 8px 32px rgba(30,30,30,0.28)"
                : "0 8px 32px rgba(90,90,90,0.18)",
            },
          }}
          onClick={() => handleAgentClick("planner")}
        >
          <Box sx={{ position: "relative", width: 90, height: 90, mb: 1 }}>
            <img
              src="/pa_new.png"
              alt="Planner Agent"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "none",
                position: "absolute",
                top: 0,
                left: 0,
                boxShadow: isDark
                  ? "0 3px 12px rgba(176, 141, 87, 0.38)"
                  : "0 3px 12px rgba(30,30,30,0.38)",
              }}
            />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isDark ? "#fff" : "#222",
              textAlign: "center",
            }}
          >
            Planner Agent
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              opacity: 0.92,
              color: isDark ? "#eaf3ff" : "#666",
              mt: 0.5,
              textAlign: "center",
            }}
          >
            Quick timetable generation
          </Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <Box
      sx={{ py: 1, px: 1, mx: "2rem", height: "70vh", boxSizing: "border-box" }}
    >
      <Grid container spacing={3}>
        {/* Quick Access Card */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 5,
              p: "0.1rem 0.2rem",
              background: isDark ? "#2c3440" : "#f5f8fa",
              width: "100%",
              height: "100%",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: isDark ? "#eaf3ff" : "#1a2332",
                }}
              >
                Quick Access
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                  justifyContent: "space-between",
                  alignItems: "stretch",
                }}
              >
                {agentsList.map((agent) => (
                  <Box
                    key={agent.id}
                    sx={{
                      flex: { xs: "1 1 100%", md: "1 1 0" },
                      display: "flex",
                      minWidth: 0,
                    }}
                  >
                    {renderAgentCard(agent)}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Guidance Chats (last 5) */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 5,
              p: "0.1rem 0.2rem",
              background: isDark ? "#2c3440" : "#f5f8fa",
              width: "100%",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  // mb: 2,
                  color: isDark ? "#eaf3ff" : "#1a2332",
                }}
              >
                Usage
              </Typography>
              <Box sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>
                <CalendarUsageMUI />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickAccessCard;
