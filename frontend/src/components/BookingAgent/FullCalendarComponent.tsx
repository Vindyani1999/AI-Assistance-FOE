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
import { fetchUserEmailFromProfile } from "../../services/api";
import { toast } from "react-toastify";
import RightDrawer from "./RightDrawer";

interface Props {
  refreshKey?: any;
  onCellClick?: (cell: any) => void;
}

const FullCalendarComponent: React.FC<Props> = ({ refreshKey, onCellClick }) => {
  const [FC, setFC] = useState<any>(null);
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  const [roomName, setRoomName] = useState("LT1");
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const { notify } = useNotification();

  const [formData, setFormData] = useState({
    room_name: "LT1",
    name: "",
    date: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    const loadCalendar = async () => {
      const fullcalendar = (await import("@fullcalendar/react")).default;
      const timeGridPlugin = (await import("@fullcalendar/timegrid")).default;
      const interactionPlugin = (await import("@fullcalendar/interaction")).default;

      setFC(() => fullcalendar);
      setCalendarPlugins([timeGridPlugin, interactionPlugin]);
    };

    loadCalendar();
  }, []);

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

  useEffect(() => {
    load(roomName);
    fetch_all_halls();
  }, [roomName, refreshKey, isOpen]);

  const fetch_moduleCodes = async (email: string) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_HBA_URL}/booking/fetch_moduleCodes_by_user_email?email=${email}`
      );
      setModuleOptions(response.data);
      return response.data;
    } catch (error: any) {
      toast.error("❌ Failed to fetch module codes");
      console.error("❌ Error fetching module codes:", error);
      return [];
    }
  };

  const fetch_all_halls = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_HBA_URL}/booking/all_halls`);
      setRoomOptions(response.data);
      return response.data;
    } catch (error: any) {
      toast.error("❌ Failed to fetch halls");
      console.error("❌ Error fetching all halls:", error);
      return [];
    }
  };

  const fetch_halls_by_moduleCode = async (moduleCode: string) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_HBA_URL}/booking/fetch_halls_by_moduleCode?module_code=${moduleCode}`
      );
      setSelectedRoomOptions(response.data);
      return response.data;
    } catch (error) {
      toast.error("❌ Failed to fetch halls by module code");
      console.error("❌ Error fetching halls:", error);
      return [];
    }
  };

  const load = async (selectedRoom: any) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_HBA_URL}/fetch_bookings?room_name=${selectedRoom}`
      );
      const bookings = response.data;

      const events = bookings.map((booking: any, index: number) => {
        const eventDate = new Date(booking.start_time * 1000);
        const today = new Date();

        const eventDateOnly = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const isToday = eventDateOnly.getTime() === todayOnly.getTime();
        const isFuture = eventDateOnly.getTime() > todayOnly.getTime();

        let classNames = [];
        if (isToday) classNames = ["fc-event-today"];
        else if (isFuture) classNames = ["fc-event-future"];
        else classNames = ["fc-event-booking"];

        return {
          id: booking.id || index.toString(),
          title: booking.name || "No Title",
          start: eventDate,
          end: new Date(booking.end_time * 1000),
          roomName: booking.room_name,
          moduleCode: booking.module_code,
          classNames,
          backgroundColor: undefined,
          borderColor: undefined,
          textColor: undefined,
        };
      });

      setEventData(events);
    } catch (error) {
      toast.error("❌ Failed to load bookings");
      console.error(error);
    }
  };

  const createBooking = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_HBA_URL}/booking/add`, formData);
      notify("success", "✅ Booking created successfully!");
      console.log("✅ Booking created:", response.data);
      setIsOpen(false);
    } catch (error: any) {
      notify("error", "❌ Failed to create booking");
      console.error(error);
    }
  };

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

  const openPickerOnInteraction = (e: any) => {
    const el =
      (e.target as HTMLInputElement) ||
      (e.currentTarget?.querySelector("input") as HTMLInputElement);
    if (el?.showPicker) {
      try {
        el.showPicker();
      } catch {}
    }
  };

  return (
    <Box p={3} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="room-select-row">
        <FormControl
          size="small"
          sx={{ minWidth: 140, maxWidth: 240, backgroundColor: "transparent" }}
        >
          <InputLabel id="room-select-label" style={{ position: "absolute", textAlign: "left" }}>
            Select Room
          </InputLabel>
          <Select
            labelId="room-select-label"
            id="room-select"
            value={roomName}
            label="Select Room"
            onChange={(e) => setRoomName(e.target.value)}
            sx={{
              background: "var(--dialog-input-bg)",
              borderRadius: "8px",
              border: "1px solid var(--dialog-border)",
              minHeight: 40,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--dialog-border) !important",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--brand-700) !important",
              },
              "& .MuiInputLabel-root": {
                color: "var(--dialog-muted-text)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "var(--brand-700) !important",
              },
              "& .MuiSelect-icon": {
                color: "var(--brand-700)",
              },
              "&.Mui-focused .MuiSelect-icon": {
                color: "var(--brand-700)",
              },
              "& .MuiSelect-select": {
                padding: "8px 12px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                color: "var(--dialog-text)",
              },
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
            px: 3,
            py: 1.4,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 0.2,
            minWidth: 10,
          }}
        >
          Manual Booking
        </Button>

        <RightDrawer openProp={isOpen} />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {FC && calendarPlugins.length > 0 && (
          <FC
            plugins={calendarPlugins}
            initialView="timeGridWeek"
            selectable={true}
            editable={true}
            nwIndicator={true}
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

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: "booking-dialog-paper", "data-theme": "" }}
      >
        <DialogTitle>
          <div className="booking-dialog-title">
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
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                sx={{ minWidth: 220 }}
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
              sx={{ minWidth: 160 }}
              InputProps={{
                onClick: openPickerOnInteraction,
                onFocus: openPickerOnInteraction,
              }}
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
              sx={{ minWidth: 160 }}
              InputProps={{
                onClick: openPickerOnInteraction,
                onFocus: openPickerOnInteraction,
              }}
            />
            <TextField
              fullWidth
              type="time"
              label="End Time"
              InputLabelProps={{ shrink: true }}
              value={formData.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
              sx={{ minWidth: 160 }}
              InputProps={{
                onClick: openPickerOnInteraction,
                onFocus: openPickerOnInteraction,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsOpen(false)} className="btn-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" className="btn-green">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FullCalendarComponent;