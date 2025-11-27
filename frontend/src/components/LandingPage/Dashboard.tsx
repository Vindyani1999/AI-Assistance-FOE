import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import QuickAccessCard from "./QuickAccessCard";
import Greeting from "./Greeting";
// import GuidanceAnalysisCard from "../GuidanceAnalysisCard/GuidanceAnalysisCard";
// import BookingAnalysisCard from "../BookingAnalysisCard/BookingAnalysisCard";
import CalendarUsageMUI from "./CalendarUsageMUI";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Badge,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Box } from "@mui/material";
import { useTheme } from "../../context/ThemeContext";
import { ChatSession } from "../../utils/types";
import { apiService, fetchUserEmailFromProfile } from "../../services/chatAPI";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  // keep props for future use
}

const Dashboard: React.FC<DashboardProps> = () => {
  // receive agents from MainLayout via Outlet context
  const outletContext = useOutletContext<{ agents?: any[] } | undefined>();
  const agents = outletContext?.agents;
  const navigate = useNavigate();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Recent guidance sessions for current user (last 5)
  const [recentSessions, setRecentSessions] = useState<ChatSession[] | null>(
    null
  );
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const userEmail = await fetchUserEmailFromProfile();
        const resp = await apiService.getChatSessions(userEmail || undefined);
        const sessions = (resp.sessions || []).sort(
          (a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        if (mounted) setRecentSessions(sessions.slice(0, 5));
      } catch (e) {
        if (mounted) setRecentSessions(null);
      } finally {
        if (mounted) setSessionsLoading(false);
      }
    };

    loadSessions();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-section">
      <div className="dashboard-banner" role="banner">
        <img
          src="/dashboard_banner.png"
          alt="Dashboard banner"
          className="dashboard-banner-image"
        />
        <div className="dashboard-banner-inner">
          <div className="dashboard-banner-overlay">
            <Greeting />

            <div style={{ marginLeft: 32 }} />
          </div>
        </div>
      </div>
      <div
        className="dashboard-top-cards"
        style={{ display: "flex", boxSizing: "border-box", padding: 12 }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ flex: 2 }}>
            <QuickAccessCard agents={agents} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="usage-card-wrapper"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Card
                elevation={2}
                sx={{
                  borderRadius: 5,
                  p: 2,
                  background: isDark ? "#23272f" : "#fff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: isDark ? "#eaf3ff" : "#1a2332",
                    }}
                  >
                    Recent Guidance Chats
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    Last 5 guidance conversations for your account
                  </Typography>

                  <Box>
                    {sessionsLoading && (
                      <Typography variant="caption">Loading…</Typography>
                    )}
                    {!sessionsLoading &&
                      recentSessions &&
                      recentSessions.length === 0 && (
                        <Typography variant="caption">
                          No recent conversations
                        </Typography>
                      )}
                    {!sessionsLoading && recentSessions && (
                      <List dense>
                        {recentSessions.map((s) => (
                          <React.Fragment key={s.session_id}>
                            <ListItem disablePadding>
                              <ListItemButton
                                onClick={() =>
                                  navigate(
                                    `/guidance-chat?session_id=${s.session_id}`
                                  )
                                }
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                  }}
                                >
                                  <ListItemText
                                    primary={s.topic || "Untitled conversation"}
                                    secondary={
                                      s.updated_at
                                        ? dayjs(s.updated_at).format(
                                            "D MMM, h:mm A"
                                          )
                                        : undefined
                                    }
                                    secondaryTypographyProps={{
                                      variant: "caption",
                                      sx: {
                                        fontSize: "0.65rem",
                                        color: "text.secondary",
                                      },
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    {s.message_count > 0 && (
                                      <Badge
                                        badgeContent={s.message_count}
                                        sx={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          "& .MuiBadge-badge": {
                                            marginLeft: 0,
                                            fontSize: "0.65rem",
                                            minWidth: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: "#8B5E3C",
                                            color: "#fff",
                                          },
                                        }}
                                      >
                                        <MailOutlineIcon
                                          fontSize="small"
                                          sx={{ color: "#8B5E3C" }}
                                        />
                                      </Badge>
                                    )}
                                  </Box>
                                </Box>
                              </ListItemButton>
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                    {!sessionsLoading && !recentSessions && (
                      <Typography variant="caption" color="text.secondary">
                        Unable to load recent tasks
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </div>
            <div style={{ marginTop: 12 }}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 5,
                  p: 2,
                  background: isDark ? "#23272f" : "#fff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: isDark ? "#eaf3ff" : "#1a2332",
                    }}
                  >
                    Documentation
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Helpful guides, API docs and how-tos for using the system
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/documentation")}
                    size="small"
                    sx={{
                      color: "#8B5E3C",
                      borderColor: "#8B5E3C",
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#8B5E3C",
                        backgroundColor: "rgba(139,94,60,0.04)",
                      },
                    }}
                  >
                    Open Documentation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* <GuidanceAnalysisCard
        timesCalled={1234}
        dailyUsage={[12, 15, 9, 20, 18, 14, 10]}
        monthlyUsage={[120, 98, 110, 130, 125, 140]}
        dailyLimit={25}
        todayUsage={18}
        lastChats={[
          {
            user: "Alice",
            message: "How do I apply for leave?",
            time: "10:02",
          },
          { user: "Bob", message: "What is the exam schedule?", time: "10:05" },
          {
            user: "Carol",
            message: "Can I get syllabus details?",
            time: "10:10",
          },
          { user: "Dave", message: "How to contact my mentor?", time: "10:15" },
          { user: "Eve", message: "Where is the library?", time: "10:20" },
        ]}
      />
      <BookingAnalysisCard
        upcomingBookings={[
          {
            title: "AI Seminar",
            start: "2025-08-20 10:00",
            end: "2025-08-20 12:00",
            room: "LT1",
          },
          {
            title: "Project Review",
            start: "2025-08-22 14:00",
            end: "2025-08-22 15:30",
            room: "Lab2",
          },
        ]}
        todaysBookings={[
          {
            title: "Faculty Meeting",
            start: "2025-08-15 09:00",
            end: "2025-08-15 10:00",
            room: "LT2",
          },
          {
            title: "Lab Session",
            start: "2025-08-15 11:00",
            end: "2025-08-15 13:00",
            room: "Lab1",
          },
        ]}
        bookingHistory={[
          {
            title: "Math Workshop",
            start: "2025-08-10 09:00",
            end: "2025-08-10 11:00",
            room: "LT2",
          },
          {
            title: "Research Meeting",
            start: "2025-08-12 13:00",
            end: "2025-08-12 14:00",
            room: "Lab1",
          },
        ]}
        calendarRefreshKey={0}
      /> */}
    </div>
  );
};

export default Dashboard;
