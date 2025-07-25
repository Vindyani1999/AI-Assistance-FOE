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
  Box
} from '@mui/material';

const roomOptions = ['LT1', 'LT2', 'Lab1', 'Lab2']; // Add as needed

interface Props {
  refreshKey?: any;
  onCellClick?: (cell: any) => void;
}
const FullCalendarComponent: React.FC<Props> = ({ refreshKey, onCellClick }) => {
  const [eventData, setEventData] = useState<EventInput[]>([]);
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

  // Handler for clicking a cell
  const handleDateClick = (arg: any) => {
    if (onCellClick) {
      onCellClick({
        date: arg.dateStr,
        allDay: arg.allDay,
        resource: arg.resource ? arg.resource.title : undefined
      });
    }
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
      </div>

      <div style={{position: 'relative'}}>
        {React.createElement(FullCalendar as any, {
          plugins: [timeGridPlugin, interactionPlugin],
          initialView: "timeGridWeek",
          selectable: true,
          editable: true,
          nowIndicator: true,
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek',
          },
          events: eventData,
          height: "auto",
          dateClick: handleDateClick
        })}
      </div>
      
    </Box>

  );
};

export default FullCalendarComponent;
