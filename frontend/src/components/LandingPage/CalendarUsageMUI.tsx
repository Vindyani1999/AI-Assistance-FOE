import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useTheme } from "@mui/material/styles";
import { getMonthlyLoginDates } from "../../services/usageAPI";
import { UsageMap } from "../../utils/types";

// Sparkline removed per request: calendars will render stacked vertically.

const makeCalendarGrid = (month: Dayjs) => {
  const start = month.startOf("month").startOf("week");
  const days: Dayjs[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(start.add(i, "day"));
  }
  return days;
};

// Simplified: backend returns a map of days where the user logged in; any
// such day is colored brown. No minute/threshold logic on the frontend.

interface CalendarUsageMUIProps {
  oneMonthOnly?: boolean;
}

const CalendarUsageMUI: React.FC<CalendarUsageMUIProps> = ({
  oneMonthOnly = false,
}) => {
  const [month, setMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [usageByMonth, setUsageByMonth] = useState<{
    [key: string]: UsageMap;
  }>({});
  const [loading, setLoading] = useState(true);
  const [showTwo, setShowTwo] = useState<boolean>(() =>
    oneMonthOnly
      ? false
      : typeof window !== "undefined"
      ? window.innerWidth >= 1000
      : false
  );

  useEffect(() => {
    if (oneMonthOnly) return; // don't listen for resize when single-month mode
    const onResize = () => setShowTwo(window.innerWidth >= 1000);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [oneMonthOnly]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchFor = async (m: Dayjs) => {
      const y = m.year();
      const mon = m.month() + 1;
      try {
        const data = await getMonthlyLoginDates(y, mon);
        return data || {};
      } catch (e) {
        return {};
      }
    };

    (async () => {
      const current = month;
      const prev = month.subtract(1, "month");
      try {
        if (!mounted) return;
        if (showTwo) {
          const [prevData, curData] = await Promise.all([
            fetchFor(prev),
            fetchFor(current),
          ]);
          if (!mounted) return;
          setUsageByMonth((old) => ({
            ...old,
            [prev.format("YYYY-MM")]: prevData,
            [current.format("YYYY-MM")]: curData,
          }));
        } else {
          const curData = await fetchFor(current);
          if (!mounted) return;
          setUsageByMonth((old) => ({
            ...old,
            [current.format("YYYY-MM")]: curData,
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [month, showTwo]);

  const theme = useTheme();
  const brown = "#8B5E3C";
  const brownContrast = "#ffffff";

  const usageFor = (m: Dayjs) => usageByMonth[m.format("YYYY-MM")] || {};

  // Compute some quick stats for header
  const currentUsage = usageFor(month);
  let loggedCount = Object.values(currentUsage).filter(Boolean).length;
  if (showTwo) {
    const prevUsage = usageFor(month.subtract(1, "month"));
    const combinedKeys = new Set<string>();
    Object.keys(prevUsage || {}).forEach(
      (k) => prevUsage[k] && combinedKeys.add(k)
    );
    Object.keys(currentUsage || {}).forEach(
      (k) => currentUsage[k] && combinedKeys.add(k)
    );
    loggedCount = combinedKeys.size;
  }
  // find last login across fetched months (current and next if present)
  const allKeys: string[] = [];
  Object.values(usageByMonth).forEach((map) => {
    Object.keys(map || {}).forEach((k) => {
      if ((map as UsageMap)[k]) allKeys.push(k);
    });
  });
  const lastLoginRaw = allKeys.length ? allKeys.sort().slice(-1)[0] : null;
  const lastLogin = lastLoginRaw
    ? // show date + time if time info available, otherwise date only
      lastLoginRaw.length > 10
      ? dayjs(lastLoginRaw).format("D MMM YYYY, h:mm A")
      : dayjs(lastLoginRaw).format("D MMM YYYY")
    : null;

  const renderSingleCalendar = (m: Dayjs) => {
    const days = makeCalendarGrid(m);
    const usageMap = usageFor(m);

    return (
      <Box sx={{ width: "100%" }} key={m.format("YYYY-MM")}>
        <Grid container spacing={0} columns={7} sx={{ mb: 0.3 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <Grid size={1} key={d} sx={{ textAlign: "center", px: 0.15 }}>
              <Typography variant="caption" color="text.secondary">
                {d}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={0} columns={7}>
          {days.map((d) => {
            const key = d.format("YYYY-MM-DD");
            const logged = !!usageMap[key];
            const isToday = d.isSame(dayjs(), "day");
            const isCurrentMonth = d.isSame(m, "month");

            return (
              <Grid size={1} key={key} sx={{ textAlign: "center", px: 0.1 }}>
                <Box
                  sx={{
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isCurrentMonth ? (
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: logged ? brown : "transparent",
                        color: logged
                          ? brownContrast
                          : theme.palette.text.primary,
                        fontWeight: isToday ? 700 : 600,
                        boxSizing: "border-box",
                        border: isToday
                          ? `2px solid ${theme.palette.primary.main}`
                          : "none",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {d.date()}
                      </Typography>
                    </Box>
                  ) : (
                    // keep cell empty for days outside the current month
                    <Box sx={{ width: 16, height: 16 }} />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Sparkline removed — charts are no longer shown in the calendar card.

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <IconButton
          aria-label="prev"
          onClick={() => setMonth((m) => m.subtract(1, "month"))}
          size="small"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            flex: 1,
            textAlign: "center",
            fontSize: { xs: "1rem", md: "1.125rem" },
          }}
        >
          {showTwo
            ? `${month
                .subtract(1, "month")
                .format("MMMM YYYY")} — ${month.format("MMMM YYYY")}`
            : month.format("MMMM YYYY")}
        </Typography>
        <IconButton
          aria-label="next"
          onClick={() => setMonth((m) => m.add(1, "month"))}
          size="small"
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Header badges above the calendar to summarize login activity */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 0.6,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Active days: use outlined style (swapped) */}
          <Chip
            label={`Active days: ${loggedCount}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: brown, color: brown, fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Last login: use same outlined brown style as Active days */}
          <Chip
            label={lastLogin ? `Last login: ${lastLogin}` : "Last login: —"}
            size="small"
            variant="outlined"
            sx={{ borderColor: brown, color: brown, fontWeight: 700 }}
          />
        </Box>
      </Box>

      {/* sparkline removed per request */}

      <Paper
        elevation={0}
        sx={{
          p: 0.4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Render calendars side-by-side when showTwo, stacked on small screens */}
        <Box
          sx={{
            display: "flex",
            gap: showTwo ? 3 : 1,
            flexDirection: showTwo ? { xs: "column", md: "row" } : "column",
            alignItems: "flex-start",
            px: 0.5,
          }}
        >
          {/* previous month (when showTwo) */}
          {showTwo && (
            <Box sx={{ width: { xs: "100%", md: "50%" } }}>
              {renderSingleCalendar(month.subtract(1, "month"))}
            </Box>
          )}

          {/* current month */}
          <Box sx={{ width: showTwo ? { xs: "100%", md: "50%" } : "100%" }}>
            {renderSingleCalendar(month)}
          </Box>
        </Box>
      </Paper>

      {/* legend removed: simple brown mark indicates the user logged in that day */}

      {loading && <Typography variant="caption">Loading usage…</Typography>}
    </Box>
  );
};

export default CalendarUsageMUI;
