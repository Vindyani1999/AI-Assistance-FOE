import React, { useEffect, useState } from 'react';
import './FullCalendarTheme.css';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { EventInput } from '@fullcalendar/core';
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
  TextField
  
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { en } from '@fullcalendar/core/internal-common';
import { fetchUserEmailFromProfile } from '../../services/api';


// const roomOptions = ['LT1', 'LT2', 'Lab1', 'Lab2']; // Add as needed

interface Props {
  refreshKey?: any;
  onCellClick?: (cell: any) => void;
}
const FullCalendarComponent: React.FC<Props> = ({ refreshKey, onCellClick }) => {
  const [eventData, setEventData] = useState<EventInput[]>([]);
  const [roomName, setRoomName] = useState('LT1');
const [isOpen, setIsOpen] = useState(false);
const [email, setEmail] = useState<string | null>(null);
const [moduleOptions, setModuleOptions] = useState<string[]>([]);
const [roomOptions, setRoomOptions] = useState<string[]>([]);
const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
const [moduleCode, setModuleCode] = useState<string | null>(null);

  useEffect(() => {
  const getEmail = async () => {
    const userEmail = await fetchUserEmailFromProfile();
    setEmail(userEmail);

    if (userEmail) {
      fetch_moduleCodes(userEmail);
    } else {
    }
  };
  getEmail();
}, []);

const [formData, setFormData] = useState({
    room_name: 'LT1',
    // module_code: ''
    name:'',
    date: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    load(roomName);
    fetch_all_halls();
  }, [roomName,refreshKey, isOpen]);

  const load = async (selectedRoom:any) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.get(`http://127.0.0.1:8000/fetch_bookings?room_name=${selectedRoom}`);
      const bookings = response.data;

      const events = bookings.map((booking:any, index:number) => ({
        id: booking.id || index.toString(),
        title: booking.name || "No Title",
        start: new Date(booking.start_time * 1000),
        end: new Date(booking.end_time * 1000),
        roomName: booking.room_name || "No Room",
      }));

      setEventData(events);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    }
  };

const createBooking = async () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  try {
    const response = await axios.post(`http://127.0.0.1:8000/booking/add`, formData);
    // Optionally, refresh the calendar or show a success message
  } catch (error) {
    console.error("❌ Error creating booking:", error);
  }
};

  // Handler for clicking a cell
const [lastClicked, setLastClicked] = useState<string | null>(null);

const handleDateClick = (arg: any) => {

  if (!onCellClick) return;

  // If same cell clicked again → clear
  if (lastClicked === arg.dateStr) {
    onCellClick(null);
    setLastClicked(null); // reset
  } else {
    onCellClick({
      id: arg.event?.id,
      startTime: arg.event?.start,
      endTime: arg.event?.end,
      title: arg.event?.title  || "No Title",
      roomName: arg.event?.roomName || "No Room",
      
    });
    setLastClicked(arg.dateStr); // update last clicked
  }
};
const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleCreate = () => {
    // Here you can call your API with formData
    setIsOpen(false);
    createBooking();
  };
const fetch_moduleCodes = async (email: string) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  try {
    const response = await axios.get(`http://127.0.0.1:8000/booking/fetch_moduleCodes_by_user_email?email=${email}`);
    setModuleOptions(response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching module codes:", error);
    return [];
  }
};

const fetch_all_halls = async () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  try {
    const response = await axios.get(`http://127.0.0.1:8000/booking/all_halls`);
    setRoomOptions(response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching all halls:", error);
    return [];
  }
};

const fetch_halls_by_moduleCode = async (moduleCode: string) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  try {
    const response = await axios.get(`http://127.0.0.1:8000/booking/fetch_halls_by_moduleCode?module_code=${moduleCode}`);
    setSelectedRoomOptions(response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching halls:", error);
    return [];
  }
};
const handleOpenDialog = (booking: any) => {
    setFormData({
      // booking_id: booking.booking_id,
      name: booking.name,
      room_name: booking.room_name,
      date: booking.date.slice(0, 10), // keep YYYY-MM-DD only
      start_time: booking.start_time,
      end_time: booking.end_time,
    });
    setIsOpen(true);
  };

  return (
    <Box p={3}>
      {/* <Typography variant="h5" mb={2}>Room Booking Calendar</Typography> */}

      {/* Dropdown to select room */}
      <div className="room-select-row">
        <FormControl style={{ minWidth: 120, maxWidth: 160, marginBottom: 0, backgroundColor: 'transparent' }}>
          <InputLabel id="room-select-label">Select Room</InputLabel>
          <Select
            labelId="room-select-label"
            id="room-select"
            value={roomName}
            label="Select Room"
            onChange={(e) => setRoomName(e.target.value)}
          >
            {roomOptions.map((room) => (
              <MenuItem key={room} value={room}>{room}</MenuItem>
            ))}
          </Select>
          
        </FormControl>
        <Button onClick={() => setIsOpen(true)} style={{ minWidth: 120, maxWidth: 160, marginBottom: 0, backgroundColor: "#FFFFFF" }}>Create</Button>
      </div>

      <div style={{ position: "relative" }}>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
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
        height="auto"
        eventClick={handleDateClick}
      />
    </div>
       {/* Popup (Modal) */}
     {/* MUI Popup (Dialog) */}
     <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Booking</DialogTitle>
        <DialogContent>
  {/* Room Name */}
 

  {/* Module Code */}
  <Box mb={2}>
    <p>*Select module code first</p>
    <FormControl fullWidth>
      <InputLabel>Module Code</InputLabel>
      <Select
  value={formData.name}
  onChange={(e) => {
    const value = e.target.value;
    if (value) {
      handleChange("name", value)
      fetch_halls_by_moduleCode(value);
    }
  }}
>

        {moduleOptions.map((code) => (
          <MenuItem key={code} value={code}>{code}</MenuItem>
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
          <MenuItem key={room} value={room}>{room}</MenuItem>
        ))}
       
      </Select>
    </FormControl>
  </Box>
  {/* Date */}
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

  {/* Start and End Time */}
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
          <Button onClick={() => setIsOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

  );
};

export default FullCalendarComponent;
