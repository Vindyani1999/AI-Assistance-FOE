// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import React, { useEffect, useState, lazy, Suspense } from "react";
// import "./FullCalendarTheme.css";
// import axios from "axios";

// import { useNotification } from "../../context/NotificationContext";
// import {
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   Box,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// // import Grid from "@mui/material/Grid";
// // import { A, en } from "@fullcalendar/core/internal-common";
// import { fetchUserEmailFromProfile } from "../../services/api";
// import { toast } from "react-toastify";
// import RightDrawer from "./RightDrawer";
// import { EventInput } from "@fullcalendar/core";
// const FullCalendar = React.lazy(() => import("@fullcalendar/react"));

// const timeGridPlugin = require("@fullcalendar/timegrid").default;
// const interactionPlugin = require("@fullcalendar/interaction").default;

// // const roomOptions = ['LT1', 'LT2', 'Lab1', 'Lab2']; // Add as needed

// interface Props {
//   refreshKey?: any;
//   onCellClick?: (cell: any) => void;
// }
// const FullCalendarComponent: React.FC<Props> = ({
//   refreshKey,
//   onCellClick,
// }) => {
//   const [eventData, setEventData] = useState<EventInput[]>([]);
//   const [roomName, setRoomName] = useState("LT1");
//   const [isOpen, setIsOpen] = useState(false);
//   const [email, setEmail] = useState<string | null>(null);
//   const [moduleOptions, setModuleOptions] = useState<string[]>([]);
//   const [roomOptions, setRoomOptions] = useState<string[]>([]);
//   const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
//   // const [moduleCode, setModuleCode] = useState<string | null>(null);
//   const { notify } = useNotification();

//   useEffect(() => {
//     const getEmail = async () => {
//       try {
//         const userEmail = await fetchUserEmailFromProfile();
//         setEmail(userEmail);

//         if (userEmail) {
//           fetch_moduleCodes(userEmail);
//           console.log(userEmail);
//         } else {
//           notify("warning", "⚠️ No email found for user");
//         }
//       } catch (err: any) {
//         notify("error", "❌ Failed to fetch user email", err.message);
//         console.error(err);
//       }
//     };
//     getEmail();
//   }, []);

//   const [formData, setFormData] = useState({
//     room_name: "LT1",
//     // module_code: ''
//     name: "",
//     date: "",
//     start_time: "",
//     end_time: "",
//   });

//   useEffect(() => {
//     load(roomName);
//     fetch_all_halls();
//   }, [roomName, refreshKey, isOpen]);

//   const load = async (selectedRoom: any) => {
//     const apiUrl = process.env.REACT_APP_API_URL;

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/fetch_bookings?room_name=${selectedRoom}`
//       );
//       const bookings = response.data;

//       const events = bookings.map((booking: any, index: number) => ({
//         id: booking.id || index.toString(),
//         title: booking.name || "No Title",
//         start: new Date(booking.start_time * 1000),
//         end: new Date(booking.end_time * 1000),
//         roomName: booking.room_name || "No Room",
//         moduleCode: booking.module_code || "No Module",
//       }));

//       setEventData(events);
//     } catch (error) {
//       toast.error("❌ Failed to load bookings", {
//         toastId: "err-load-bookings",
//       });
//       console.error("❌ Error fetching bookings:", error);
//     }
//   };

//   const createBooking = async () => {
//     const apiUrl = process.env.REACT_APP_API_URL;

//     try {
//       const response = await axios.post(
//         `http://127.0.0.1:8000/booking/add`,
//         formData
//       );
//       notify("success", "✅ Booking created successfully!");
//       console.log("✅ Booking created:", response.data);

//       // Optionally, refresh the calendar or show a success message
//     } catch (error: any) {
//       notify(
//         "error",
//         `❌ Failed to create booking: ${
//           error.response?.data?.message || error.message
//         }`
//       );
//       console.error("❌ Error creating booking:", error);
//     }
//   };

//   // Handler for clicking a cell
//   const [lastClicked, setLastClicked] = useState<string | null>(null);

//   const handleDateClick = (arg: any) => {
//     if (!onCellClick) return;

//     // If same cell clicked again → clear
//     if (lastClicked === arg.dateStr) {
//       onCellClick(null);
//       setLastClicked(null); // reset
//     } else {
//       onCellClick({
//         id: arg.event?.id,
//         startTime: arg.event?.start,
//         endTime: arg.event?.end,
//         title: arg.event?.title || "No Title",
//         roomName: arg.event?.roomName || "No Room",
//       });
//       setLastClicked(arg.dateStr); // update last clicked
//     }
//   };
//   const handleChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleCreate = () => {
//     if (
//       !formData.name ||
//       !formData.room_name ||
//       !formData.date ||
//       !formData.start_time ||
//       !formData.end_time
//     ) {
//       notify(
//         "warning",
//         "⚠️ Please fill in all fields before creating a booking"
//       );
//       return;
//     }
//     createBooking();
//     setIsOpen(false);
//   };
//   const fetch_moduleCodes = async (email: string) => {
//     const apiUrl = process.env.REACT_APP_API_URL;

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/booking/fetch_moduleCodes_by_user_email?email=${email}`
//       );
//       setModuleOptions(response.data);
//       return response.data;
//     } catch (error: any) {
//       toast.error("❌ Failed to fetch module codes", {
//         toastId: "err-fetch-module-codes",
//       });
//       console.error("❌ Error fetching module codes:", error);
//       return [];
//     }
//   };

//   const fetch_all_halls = async () => {
//     const apiUrl = process.env.REACT_APP_API_URL;

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/booking/all_halls`
//       );
//       setRoomOptions(response.data);
//       return response.data;
//     } catch (error: any) {
//       toast.error("❌ Failed to fetch halls", { toastId: "err-fetch-halls" });
//       console.error("❌ Error fetching all halls:", error);
//       return [];
//     }
//   };

//   const fetch_halls_by_moduleCode = async (moduleCode: string) => {
//     const apiUrl = process.env.REACT_APP_API_URL;

//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:8000/booking/fetch_halls_by_moduleCode?module_code=${moduleCode}`
//       );
//       setSelectedRoomOptions(response.data);
//       return response.data;
//     } catch (error) {
//       toast.error("❌ Failed to fetch halls by module code", {
//         toastId: "err-fetch-halls-by-module",
//       });
//       console.error("❌ Error fetching halls:", error);
//       return [];
//     }
//   };
//   const handleOpenDialog = (booking: any) => {
//     setFormData({
//       // booking_id: booking.booking_id,
//       name: booking.name,
//       room_name: booking.room_name,
//       date: booking.date.slice(0, 10), // keep YYYY-MM-DD only
//       start_time: booking.start_time,
//       end_time: booking.end_time,
//     });
//     setIsOpen(true);
//   };

//   return (
//     <Box
//       p={3}
//       sx={{ height: "100%", display: "flex", flexDirection: "column" }}
//     >
//       {/* <Typography variant="h5" mb={2}>Room Booking Calendar</Typography> */}

//       {/* Dropdown to select room */}
//       <div className="room-select-row">
//         <FormControl
//           size="small"
//           sx={{ minWidth: 140, maxWidth: 240, backgroundColor: "transparent" }}
//         >
//           <InputLabel
//             id="room-select-label"
//             style={{ position: "absolute", textAlign: "left" }}
//           >
//             Select Room
//           </InputLabel>
//           <Select
//             labelId="room-select-label"
//             id="room-select"
//             value={roomName}
//             label="Select Room"
//             onChange={(e) => setRoomName(e.target.value)}
//             sx={{
//               background: "var(--muted-100)",
//               borderRadius: "8px",
//               "& .MuiSelect-select": {
//                 padding: "8px 12px",
//                 textAlign: "left",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "flex-start",
//               },
//               border: "1px solid var(--muted-200)",
//               minHeight: 40,
//             }}
//           >
//             {roomOptions.map((room) => (
//               <MenuItem key={room} value={room}>
//                 {room}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <Button
//           onClick={() => setIsOpen(true)}
//           variant="contained"
//           className="btn-green"
//           startIcon={<AddIcon />}
//           sx={{
//             minWidth: 140,
//             maxWidth: 220,
//             borderRadius: "9999px",
//             textTransform: "none",
//           }}
//         >
//           Manual Booking
//         </Button>
//         <RightDrawer />
//       </div>

//       <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
//         <Suspense fallback={<div>Loading calendar...</div>}>
//           <FullCalendar
//             plugins={[timeGridPlugin, interactionPlugin]}
//             initialView="timeGridWeek"
//             selectable={true}
//             editable={true}
//             nowIndicator={true}
//             headerToolbar={{
//               left: "prev,next today",
//               center: "title",
//               right: "timeGridDay,timeGridWeek",
//             }}
//             events={eventData}
//             height="100%"
//             eventClick={handleDateClick}
//           />
//         </Suspense>
//       </div>
//       {/* Popup (Modal) */}
//       {/* MUI Popup (Dialog) */}
//       <Dialog
//         open={isOpen}
//         onClose={() => setIsOpen(false)}
//         fullWidth
//         maxWidth="sm"
//       >
//         <DialogTitle>Create New Booking</DialogTitle>
//         <DialogContent>
//           {/* Room Name */}

//           {/* Module Code */}
//           <Box mb={2}>
//             <p>*Select module code first</p>
//             <FormControl fullWidth>
//               <InputLabel>Module Code</InputLabel>
//               <Select
//                 value={formData.name}
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   if (value) {
//                     handleChange("name", value);
//                     fetch_halls_by_moduleCode(value);
//                   }
//                 }}
//               >
//                 {moduleOptions.map((code) => (
//                   <MenuItem key={code} value={code}>
//                     {code}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Box>
//           <Box mb={2}>
//             <FormControl fullWidth>
//               <InputLabel>Room Name</InputLabel>
//               <Select
//                 value={formData.room_name}
//                 onChange={(e) => handleChange("room_name", e.target.value)}
//                 disabled={!formData.name}
//               >
//                 {selectedRoomOptions.map((room) => (
//                   <MenuItem key={room} value={room}>
//                     {room}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Box>
//           {/* Date */}
//           <Box mb={2}>
//             <TextField
//               fullWidth
//               type="date"
//               label="Date"
//               InputLabelProps={{ shrink: true }}
//               value={formData.date}
//               onChange={(e) => handleChange("date", e.target.value)}
//             />
//           </Box>

//           {/* Start and End Time */}
//           <Box display="flex" gap={2} mb={2}>
//             <TextField
//               fullWidth
//               type="time"
//               label="Start Time"
//               InputLabelProps={{ shrink: true }}
//               value={formData.start_time}
//               onChange={(e) => handleChange("start_time", e.target.value)}
//             />
//             <TextField
//               fullWidth
//               type="time"
//               label="End Time"
//               InputLabelProps={{ shrink: true }}
//               value={formData.end_time}
//               onChange={(e) => handleChange("end_time", e.target.value)}
//             />
//           </Box>
//         </DialogContent>

//         <DialogActions>
//           <Button onClick={() => setIsOpen(false)} color="secondary">
//             Cancel
//           </Button>
//           <Button onClick={handleCreate} variant="contained" color="primary">
//             Create
//           </Button>
//         </DialogActions>
//       </Dialog>
//       {/* ToastContainer intentionally removed from here; a single ToastContainer is rendered in BookingChatInterface */}
//     </Box>
//   );
// };

// export default FullCalendarComponent;

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import "./FullCalendarTheme.css";
import axios from "axios";
import { useNotification } from "../../context/NotificationContext";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import { fetchUserEmailFromProfile } from "../../services/chatAPI";
import { toast } from "react-toastify";
import RightDrawer from "./RightDrawer";
// import AddBoxIcon from "@mui/icons-material/AddBox";
import { CalendarProps } from "../../utils/types";

const FullCalendarComponent: React.FC<CalendarProps> = ({
  refreshKey,
  onCellClick,
}) => {
  // ← Dynamic imports loaded here
  const [FC, setFC] = useState<any>(null);
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);

  // Load FullCalendar dynamically so TS does not convert it to require()
  useEffect(() => {
    const loadCalendar = async () => {
      const fullcalendar = (await import("@fullcalendar/react")).default;
      const timeGridPlugin = (await import("@fullcalendar/timegrid")).default;
      const interactionPlugin = (await import("@fullcalendar/interaction"))
        .default;

      setFC(() => fullcalendar);
      setCalendarPlugins([timeGridPlugin, interactionPlugin]);
    };

    loadCalendar();
  }, []);

  // ------------------------------------------------------------------------------------

  const [eventData, setEventData] = useState<any[]>([]);
  const [roomName, setRoomName] = useState("LT1");
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
  const { notify } = useNotification();

  useEffect(() => {
    const getEmail = async () => {
      try {
        const userEmail = await fetchUserEmailFromProfile();
        setEmail(userEmail);

        if (userEmail) {
          fetch_moduleCodes(userEmail);
        } else {
          notify("warning", "⚠️ No email found for user");
        }
      } catch (err: any) {
        notify("error", "❌ Failed to fetch user email");
        console.error(err);
      }
    };
    getEmail();
  }, []);

  const [formData, setFormData] = useState({
    room_name: "LT1",
    name: "",
    date: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    load(roomName);
    fetch_all_halls();
  }, [roomName, refreshKey, isOpen]);

  const load = async (selectedRoom: any) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/fetch_bookings?room_name=${selectedRoom}`
      );
      const bookings = response.data;

      const events = bookings.map((booking: any, index: number) => ({
        id: booking.id || index.toString(),
        title: booking.name || "No Title",
        start: new Date(booking.start_time * 1000),
        end: new Date(booking.end_time * 1000),
        roomName: booking.room_name,
        moduleCode: booking.module_code,
      }));

      setEventData(events);
    } catch (error) {
      toast.error("❌ Failed to load bookings");
      console.error(error);
    }
  };

  const createBooking = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/booking/add`, formData);
      notify("success", "✅ Booking created successfully!");
    } catch (error: any) {
      notify("error", "❌ Failed to create booking");
      console.error(error);
    }
  };

  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const handleDateClick = (arg: any) => {
    if (!onCellClick) return;

    if (lastClicked === arg.dateStr) {
      onCellClick(null);
      setLastClicked(null);
    } else {
      onCellClick({
        id: arg.event?.id,
        startTime: arg.event?.start,
        endTime: arg.event?.end,
        title: arg.event?.title,
        roomName: arg.event?.roomName,
      });
      setLastClicked(arg.dateStr);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = () => {
    if (
      !formData.name ||
      !formData.room_name ||
      !formData.date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      notify("warning", "⚠️ Please fill in all fields.");
      return;
    }
    createBooking();
  };

  const fetch_moduleCodes = async (email: string) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/booking/fetch_moduleCodes_by_user_email?email=${email}`
      );
      setModuleOptions(response.data);
    } catch (error) {
      toast.error("❌ Failed to fetch module codes", {
        toastId: "err-fetch-module-codes",
      });
    }
  };

  const fetch_all_halls = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/booking/all_halls`
      );
      setRoomOptions(response.data);
    } catch (error) {
      toast.error("❌ Failed to fetch halls", { toastId: "err-fetch-halls" });
    }
  };

  const fetch_halls_by_moduleCode = async (moduleCode: string) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/booking/fetch_halls_by_moduleCode?module_code=${moduleCode}`
      );
      setSelectedRoomOptions(response.data);
    } catch (error) {
      toast.error("❌ Failed to fetch halls by module", {
        toastId: "err-fetch-halls-by-module",
      });
    }
  };

  return (
    <Box
      p={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="room-select-row">
        <FormControl
          size="small"
          sx={{ minWidth: 140, maxWidth: 240, backgroundColor: "transparent" }}
        >
          <InputLabel
            id="room-select-label"
            style={{ position: "absolute", textAlign: "left" }}
          >
            Select Room
          </InputLabel>
          <Select
            labelId="room-select-label"
            id="room-select"
            value={roomName}
            label="Select Room"
            onChange={(e) => setRoomName(e.target.value)}
            sx={{
              background: "var(--muted-100)",
              borderRadius: "8px",
              "& .MuiSelect-select": {
                padding: "8px 12px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              },
              border: "1px solid var(--muted-200)",
              minHeight: 40,
            }}
          >
            {roomOptions.map((room) => (
              <MenuItem key={room} value={room}>
                {room}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={() => setIsOpen(true)}
          variant="contained"
          className="btn-green"
          startIcon={<AddIcon />}
          sx={{
            minWidth: 140,
            maxWidth: 220,
            borderRadius: "9999px",
            textTransform: "none",
          }}
        >
          Manual Booking
        </Button>
        <RightDrawer />
      </div>
      {/* <div className="room-select-row">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Select Room</InputLabel>
          <Select
            value={roomName}
            label="Select Room"
            onChange={(e) => setRoomName(e.target.value)}
          >
            {roomOptions.map((room) => (
              <MenuItem key={room} value={room}>
                {room}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          onClick={() => setIsOpen(true)}
          variant="contained"
          startIcon={<AddIcon />}
        >
          Manual Booking
        </Button>

        <RightDrawer />
      </div> */}

      {/* FullCalendar rendering */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {FC && calendarPlugins.length > 0 && (
          <FC
            plugins={calendarPlugins}
            initialView="timeGridWeek"
            selectable={true}
            editable={true}
            nowIndicator={true}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridDay,timeGridWeek",
            }}
            events={eventData}
            height="100%"
            eventClick={handleDateClick}
          />
        )}
      </div>

      {/* Booking Modal */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <div className="booking-dialog-title">
            {/* <div className="title-icon">
              <AddBoxIcon fontSize="large" />
            </div> */}
            <div className="title-text">Create New Booking</div>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <p>*Select module code first</p>
            <FormControl fullWidth>
              <InputLabel>Module Code</InputLabel>
              <Select
                value={formData.name}
                onChange={(e) => {
                  handleChange("name", e.target.value);
                  fetch_halls_by_moduleCode(e.target.value);
                }}
              >
                {moduleOptions.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box mb={2}>
            <FormControl fullWidth>
              <InputLabel>Room Name</InputLabel>
              <Select
                value={formData.room_name}
                onChange={(e) => handleChange("room_name", e.target.value)}
                disabled={!formData.name}
              >
                {selectedRoomOptions.map((room) => (
                  <MenuItem key={room} value={room}>
                    {room}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box mb={2}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </Box>

          <Box display="flex" gap={2} mb={2}>
            <TextField
              fullWidth
              type="time"
              label="Start Time"
              InputLabelProps={{ shrink: true }}
              value={formData.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
            />
            <TextField
              fullWidth
              type="time"
              label="End Time"
              InputLabelProps={{ shrink: true }}
              value={formData.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            className="btn-green"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FullCalendarComponent;
