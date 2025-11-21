import * as React from "react";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
// Upload controls handled in the PlannerChatInterface sidebar; local upload UI removed
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import axios from "axios";
import { useEffect, useMemo,useState } from "react";
import "./ExamTimeTable.css";

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
const days = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
  "Day 8",
  "Day 9",
  "Day 10",
  "Day 11",
  "Day 12",
  "Day 13",
  "Day 14",
];


// Timetable display table
// Timetable display table (Exam: x-axis = time slots, y-axis = days)
// Timetable display table (Exam: x-axis = time slots, y-axis = days)
function TimetableTable({ timetable }) {

  console.log("timetable",timetable);
  
  const timeSlots = Array.from(
  { length: 2 },
  (_, i) => `${8 + i}:00 - ${9 + i}:00`
);

  

  // -------------------------------
// BUILD 2ND TABLE FROM FIRST TABLE
// -------------------------------
const moduleNames = {
  "IS1402": "Mathematical Fundamentals for Engineers",
  "IS1301": "Communication for Engineers",
  "CE1202": "Introduction to Infrastructure Planning",
  "CE1101": "Engineering Fundamentals",
  "EE1301": "Circuit Analysis",
  "CE3201": "Structural Analysis III",
  "CE3202": "Engineering Surveying",
  "IS1003": "Complex Analysis"
};

// Convert timetable → flat list
const flatList = useMemo(() => {
  const list = [];

  days.forEach(day => {
    if (!timetable[day]) return;

    Object.keys(timetable[day]).forEach(slotIndex => {
      const slotModules = timetable[day][slotIndex];

      slotModules.forEach(m => {
        list.push({
          date: day,
          slot: Number(slotIndex),
          code: m.code,
          hall: m.hall,
          students: m.students ?? 0,
          semester: m.semester ?? 1,
          name:m.name
        });
      });
    });
  });

  return list;
}, [timetable]);

// Map slot → time label
// const timeSlots = {
//   0: "9.00 a.m. – 12.00 noon",
//   1: "1.00 p.m. – 4.00 p.m.",
//   2: "4.30 p.m. – 6.30 p.m."
// };

// Group by DATE + TIME
const groupedData = useMemo(() => {
  const groups = {};

  flatList.forEach(row => {
    const time = timeSlots[row.slot];
    const key = `${row.date}-${time}`;

    if (!groups[key]) {
      groups[key] = {
        date: row.date,
        time,
        rows: []
      };
    }
    groups[key].rows.push(row);
  });
console.log("groups",groups);

  return Object.values(groups);
}, [flatList]);

  const theme = useMuiTheme();

  // Prefer CSS variables with MUI fallbacks so global CSS theme overrides apply
  const panelBg = `var(--item-bg, ${theme.palette.background.paper})`;
  const headBg = `var(--dialog-input-bg, ${theme.palette.action.hover})`;
  const mutedText = `var(--dialog-muted-text, ${theme.palette.text.secondary})`;
  const dividerColor = `var(--dialog-border, ${theme.palette.divider})`;
  const primaryText = `var(--dialog-text, ${theme.palette.text.primary})`;
  const eventText = `var(--event-text, ${theme.palette.primary.contrastText})`;

  return (
    <div>
      <div style={{ marginBottom: 8, fontStyle: "italic", color: mutedText }}>
        This view is only for exam timetables2.
      </div>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: panelBg,
          boxShadow: theme.shadows[1],
          overflowX: "auto",
          width: "100%",
        }}
      >
        {/* <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: mutedText }}>Day</TableCell>
              {timeSlots.map((slot, i) => (
                <TableCell
                  key={i}
                  sx={{
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: headBg,
                    color: primaryText,
                  }}
                >
                  {slot}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day}>
                <TableCell sx={{ fontWeight: 700, color: primaryText }}>
                  {day}
                </TableCell>
                {timeSlots.map((_, slotIdx) => {
                  const slotModules = timetable?.[day]?.[slotIdx] || [];
                  return (
                    <TableCell
                      key={day + "-" + slotIdx}
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
                      {slotModules.length
                        ? slotModules.map((mod, i) => (
                            <div key={i}>
                              {mod.code} ({mod.hall})
                            </div>
                          ))
                        : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table> */}
       <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
  <TableHead>
    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
      <TableCell sx={{ fontWeight: "bold", width: "80px" }}>DATE</TableCell>
      <TableCell sx={{ fontWeight: "bold", width: "140px" }}>TIME</TableCell>
      <TableCell sx={{ fontWeight: "bold", width: "120px" }}>MODULE NO.</TableCell>
      <TableCell sx={{ fontWeight: "bold", width: "120px" }}>STU.COUNT</TableCell>
      <TableCell sx={{ fontWeight: "bold", width: "120px" }}>VENUE</TableCell>
      <TableCell sx={{ fontWeight: "bold" }}>MODULE NAME</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
    {groupedData.map((group, i) => (
      <React.Fragment key={i}>
        {group.rows.map((r, j) => (
          <TableRow key={i + "-" + j}>
            
            {j === 0 && (
              <>
                <TableCell rowSpan={group.rows.length} sx={{ fontWeight: "600" }}>
                  {group.date}
                </TableCell>
                <TableCell rowSpan={group.rows.length}>{group.time}</TableCell>
              </>
            )}

            <TableCell>
              <Typography sx={{ fontWeight: 600 }}>{r.code}</Typography>
              <Typography variant="caption" color="text.secondary">
                C{r.semester === 1 ? "-23" : "-18"}
              </Typography>
            </TableCell>

            <TableCell sx={{ textAlign: "center" }}>{r.students}</TableCell>
            <TableCell>{r.hall}</TableCell>

            <TableCell>
             {r.name || "Module Name Not Available"}
              <Typography variant="caption" color="text.secondary" display="block">
                Curriculum – {r.semester === 1 ? "2023" : "2018"}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    ))}
  </TableBody>
</Table>

      </TableContainer>
    </div>
  );
}

export default function ExamTimeTable({ isFetching }) {
  const [tab, setTab] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [theme, setTheme] = React.useState("light");

    useEffect(() => {
    const docTheme =
      document.documentElement.getAttribute("data-theme") ||
      (document.body.classList.contains("dark-theme") ? "dark" : null);
    if (docTheme) setTheme(docTheme === "dark" ? "dark" : "light");
    // basic listener to react to future changes (optional)
    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") ||
        (document.body.classList.contains("dark-theme") ? "dark" : "light");
      setTheme(newTheme === "dark" ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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


  const [firstExamFile, setFirstExamFile] = React.useState(null);
  const handleExamFileChange = (event) => {
    setFirstExamFile(event.target.files[0]);
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
  // Exam upload handled by sidebar; removed local upload handlers

  // Fetch timetable data from backend
  const getCalenderData = async () => {
    try {
      const response = await axios.get(
        process.env.REACT_APP_PLANNER_URL + "/api/solver-exam-results"
      );
      const data = response.data || [];

      const dayMap = {
        day1: "Day 1",
        day2: "Day 2",
        day3: "Day 3",
        day4: "Day 4",
        day5: "Day 5",
        day6: "Day 6",
        day7: "Day 7",
        day8: "Day 8",
        day9: "Day 9",
        day10: "Day 10",
        day11: "Day 11",
        day12: "Day 12",
        day13: "Day 13",
        day14: "Day 14",
      };

      // Convert response data into timetable format
      const semesterTimetables = semesters.map((sem) => {
        const filtered = data.filter((entry) => entry.semester === sem);
        const timetable = {};
        console.log("filtered",filtered);
        

        filtered.forEach((entry) => {
          const dayName = dayMap[entry.day] || entry.day;
          if (!timetable[dayName]) timetable[dayName] = {};
          if (!timetable[dayName][entry.slot])
            timetable[dayName][entry.slot] = [];
          timetable[dayName][entry.slot].push({
            code: entry.code,
            hall: entry.hall,
            students: entry.students,
            semester: entry.semester,
            name: entry.name
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
  useEffect(() => {
    getCalenderData();
  }, [semester, isFetching]);

  return (
    <Box sx={{ flexGrow: 1 }} data-theme={appTheme}>
      <Grid container spacing={2}>
        {/* Upload handled by the PlannerChatInterface sidebar; left upload panels removed */}
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
