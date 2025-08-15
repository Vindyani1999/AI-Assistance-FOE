import React from 'react';
import FullCalendarComponent from '../BookingAgent/FullCalendarComponent';
import './BookingAnalysisCard.css';

interface BookingAnalysisCardProps {
  upcomingBookings: Array<{ title: string; start: string; end: string; room: string }>;
  bookingHistory: Array<{ title: string; start: string; end: string; room: string }>;
  todaysBookings?: Array<{ title: string; start: string; end: string; room: string }>;
  calendarRefreshKey?: any;
}

const BookingAnalysisCard: React.FC<BookingAnalysisCardProps> = ({
  upcomingBookings = [],
  bookingHistory = [],
  todaysBookings = [],
  calendarRefreshKey,
}) => {
  return (
    <div className="booking-analysis-card">
      <h3>Booking Agent Analysis</h3>
      <div className="booking-analysis-content">
        <div className="booking-columns">
          <div className="booking-column">
            <div className="booking-section booking-sub-card">
              <div className="booking-label">Upcoming Bookings</div>
              <div className="booking-list">
                {upcomingBookings.length === 0 ? (
                  <div className="empty-booking">No upcoming bookings.</div>
                ) : (
                  upcomingBookings.map((booking, idx) => (
                    <div key={idx} className="booking-item">
                      <div className="booking-title">{booking.title}</div>
                      <div className="booking-details">
                        <span>{booking.room}</span> | <span>{booking.start}</span> - <span>{booking.end}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="booking-section booking-sub-card">
              <div className="booking-label">Today's Bookings</div>
              <div className="booking-list">
                {todaysBookings.length === 0 ? (
                  <div className="empty-booking">No bookings for today.</div>
                ) : (
                  todaysBookings.map((booking, idx) => (
                    <div key={idx} className="booking-item">
                      <div className="booking-title">{booking.title}</div>
                      <div className="booking-details">
                        <span>{booking.room}</span> | <span>{booking.start}</span> - <span>{booking.end}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="booking-section booking-sub-card">
              <div className="booking-label">Booking History</div>
              <div className="booking-list">
                {bookingHistory.length === 0 ? (
                  <div className="empty-booking">No booking history.</div>
                ) : (
                  bookingHistory.map((booking, idx) => (
                    <div key={idx} className="booking-item">
                      <div className="booking-title">{booking.title}</div>
                      <div className="booking-details">
                        <span>{booking.room}</span> | <span>{booking.start}</span> - <span>{booking.end}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="booking-column calendar-column">
            <div className="booking-section booking-sub-card calendar-sub-card">
              {/* <div className="booking-label">Booking Calendar</div> */}
              <div className="calendar-container">
                <FullCalendarComponent refreshKey={calendarRefreshKey} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAnalysisCard;
