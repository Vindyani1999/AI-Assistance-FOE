import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Typography
} from '@mui/material';

const roomOptions = ['LT1', 'LT2', 'Lab1', 'Lab2']; // Add as needed

interface Props {
  refreshKey?: any;
}
const FullCalendarComponent: React.FC<Props> = ({ refreshKey}) => {
  const [eventData, setEventData] = useState([]);
  const [roomName, setRoomName] = useState('LT1');

  useEffect(() => {
    load(roomName);
  }, [roomName,refreshKey]);

  const load = async (selectedRoom:any) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.get(`http://127.0.0.1:8000/fetch_bookings?room_name=${selectedRoom}`);
      const bookings = response.data;

      const events = bookings.map((booking:any, index:number) => ({
        id: index,
        title: booking.name || "No Title",
        start: new Date(booking.start_time * 1000),
        end: new Date(booking.end_time * 1000)
      }));

      setEventData(events);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    }
  };

  return (
    <Box p={3}>
      {/* <Typography variant="h5" mb={2}>Room Booking Calendar</Typography> */}

      {/* Dropdown to select room */}
      <FormControl fullWidth style={{ maxWidth: 300, marginBottom: '20px' }}>
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

      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={true}
        editable={true}
        nowIndicator={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek',
        }}
        events={eventData}
        height="auto"
      />
    </Box>
  );
};

export default FullCalendarComponent;
