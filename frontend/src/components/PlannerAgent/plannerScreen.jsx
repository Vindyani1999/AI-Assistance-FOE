import * as React from "react";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
// upload controls are handled in the PlannerChatInterface sidebar
// imports for Button/Input/Typography removed from this view
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import axios from "axios";
import { useEffect } from "react";
import "./ExamTimeTable.css";
import { useTheme as useAppTheme } from "../../context/ThemeContext";

const Item = styled(Paper)(({ theme }) => ({
  // prefer the global CSS variable for panel surface (FullCalendarTheme.css)
  // fall back to MUI palette when variable is not present
  backgroundColor: `var(--item-bg, ${theme.palette.background.default})`,
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: `var(--dialog-text, ${theme.palette.text.primary})`,
}));

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timetable-tabpanel-${index}`}
      aria-labelledby={`timetable-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = Array.from(
  { length: 10 },
  (_, i) => `${8 + i}:00 - ${9 + i}:00`
);

// Timetable display table
function TimetableTable({ timetable }) {
const [selectedFile, setSelectedFile] = React.useState(null);
  // const [theme, setTheme] = React.useState("light");

    useEffect(() => {
    const docTheme =
      document.documentElement.getAttribute("data-theme") ||
      (document.body.classList.contains("dark-theme") ? "dark" : null);
    // if (docTheme) setTheme(docTheme === "dark" ? "dark" : "light");
    // basic listener to react to future changes (optional)
    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") ||
        (document.body.classList.contains("dark-theme") ? "dark" : "light");
      // setTheme(newTheme === "dark" ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);


  const theme = useMuiTheme();
  // Prefer CSS variables provided by FullCalendarTheme.css (supports dark/light)
  // with a fallback to the MUI palette when variables are not present.
  const panelBg = `var(--item-bg, ${theme.palette.background.paper})`;
  const headBg = `var(--dialog-input-bg, ${theme.palette.action.hover})`;
  const mutedText = `var(--dialog-muted-text, ${theme.palette.text.secondary})`;
  const dividerColor = `var(--dialog-border, ${theme.palette.divider})`;
  const primaryText = `var(--dialog-text, ${theme.palette.text.primary})`;
  const eventText = `var(--event-text, ${theme.palette.primary.contrastText})`;

  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: panelBg,
        boxShadow: theme.shadows[1],
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: mutedText }}>Time</TableCell>
            {days.map((day) => (
              <TableCell
                key={day}
                sx={{
                  backgroundColor: headBg,
                  color: primaryText,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {day}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {timeSlots.map((slotLabel, rowIdx) => (
            <TableRow key={slotLabel}>
              <TableCell
                sx={{
                  borderBottom: `1px solid ${dividerColor}`,
                  color: mutedText,
                }}
              >
                {slotLabel}
              </TableCell>
              {days.map((day) => {
                const slotModules = timetable?.[day]?.[rowIdx] || [];
                return (
                  <TableCell
                    key={day + "-" + rowIdx}
                    sx={{
                      backgroundColor: slotModules.length
                        ? theme.palette.primary.main
                        : "transparent",
                      color: slotModules.length ? eventText : primaryText,
                      textAlign: "center",
                      fontWeight: slotModules.length ? 700 : "normal",
                      verticalAlign: "middle",
                      whiteSpace: "pre-line",
                      borderBottom: `1px solid ${dividerColor}`,
                    }}
                  >
                    {slotModules.map((mod, i) => (
                      <div key={i}>
                        {mod.code} ({mod.hall})
                      </div>
                    ))}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function PlannerScreen({ isFetching }) {
  const [tab, setTab] = React.useState(0);
  const { theme: appTheme } = useAppTheme();
  const muiTheme = useMuiTheme();

  const semesters = [1, 3, 5, 7];
  const [calenderData, setCalenderData] = React.useState(
    semesters.map(() => ({}))
  );

  // This tracks the active semester number (e.g., 1, 3, 5, 7)
  const [semester, setSemester] = React.useState(semesters[0]);

  // Handle tab switching
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setSemester(semesters[newValue]); // Link tab index to actual semester
  };
const [selectedFile, setSelectedFile] = React.useState(null);
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  const [firstExamFile, setFirstExamFile] = React.useState(null);
  const handleExamFileChange = (event) => {
    setFirstExamFile(event.target.files[0]);
  };

  // File upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        process.env.REACT_APP_PLANNER_URL + "/api/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data);
      await getCalenderData(); // Refresh timetable
    } catch (error) {
      const message =
        error.response?.data || "Upload failed. Please try again.";
      alert(message);
      console.error("Upload failed:", error);
    }
  };
  const handleExamUpload = async () => {
    if (!firstExamFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", firstExamFile);

    try {
      const response = await axios.post(
        process.env.REACT_APP_PLANNER_URL + "/api/uploadExam",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data);
      await getCalenderData(); // Refresh timetable
    } catch (error) {
      const message =
        error.response?.data || "Upload failed. Please try again.";
      alert(message);
      console.error("Upload failed:", error);
    }
  };

  // Fetch timetable data from backend
  const getCalenderData = async () => {
    try {
      const response = await axios.get(
        process.env.REACT_APP_PLANNER_URL + "/api/solver-results"
      );
      const data = response.data || [];

      const dayMap = {
        Mon: "Monday",
        Tue: "Tuesday",
        Wed: "Wednesday",
        Thu: "Thursday",
        Fri: "Friday",
        Sat: "Saturday",
        Sun: "Sunday",
      };

      // Convert response data into timetable format
      const semesterTimetables = semesters.map((sem) => {
        const filtered = data.filter((entry) => entry.semester === sem);
        const timetable = {};

        filtered.forEach((entry) => {
          const dayName = dayMap[entry.day] || entry.day;
          if (!timetable[dayName]) timetable[dayName] = {};
          if (!timetable[dayName][entry.slot])
            timetable[dayName][entry.slot] = [];
          timetable[dayName][entry.slot].push({
            code: entry.code,
            hall: entry.hall,
          });
        });

        return timetable;
      });

      setCalenderData(semesterTimetables);
      console.log("Final timetable data:", semesterTimetables);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setCalenderData(semesters.map(() => ({})));
    }
  };

  // Fetch when component loads or semester changes
  React.useEffect(() => {
    getCalenderData();
    // we intentionally only run when semester changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, isFetching]);

  return (
    <Box sx={{ flexGrow: 1 }} data-theme={appTheme}>
      <Grid container spacing={2}>
        {/* Upload handled by the right sidebar in PlannerChatInterface; left upload panel removed */}
        {/* <Grid item xs={4}>
          <Item sx={{ height: "100%", boxSizing: "border-box" }}>
            <Typography variant="h6">Upload File</Typography>
            <label htmlFor="exam-file">
              <Input
                id="exam-file"
                type="file"
                sx={{ display: "none" }}
                onChange={handleExamFileChange}
              />
              <Button variant="contained" component="span">
                Choose File
              </Button>
              {firstExamFile && (
                <Typography variant="body2" sx={{ ml: 2, display: "inline" }}>
                  {firstExamFile.name}
                </Typography>
              )}
            </label>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleExamUpload}
                disabled={!firstExamFile}
              >
                Generate Exam Timetable
              </Button>
            </Box>
          </Item>
        </Grid> */}
        {/* Timetable Display */}
        <Grid item xs={12}>
          <Item sx={{ height: "100%", boxSizing: "border-box" }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              aria-label="Timetable Tabs"
              variant="fullWidth"
              sx={{
                mb: 2,
                "& .MuiTabs-indicator": {
                  backgroundColor: `var(--action-primary-start, ${muiTheme.palette.success.main})`,
                },
              }}
            >
              {semesters.map((s, i) => (
                <Tab
                  key={s}
                  label={`Semester ${s}`}
                  sx={{
                    textTransform: "none",
                    color: `var(--brand-500, ${muiTheme.palette.primary.dark})`,
                    fontWeight: 700,
                    "&.Mui-selected": {
                      color: `var(--action-primary-start, ${muiTheme.palette.success.main})`,
                    },
                  }}
                />
              ))}
            </Tabs>

            {semesters.map((sem, idx) => (
              <TabPanel value={tab} index={idx} key={sem}>
                <TimetableTable timetable={calenderData[idx]} />
              </TabPanel>
            ))}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
