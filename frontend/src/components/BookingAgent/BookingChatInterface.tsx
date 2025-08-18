import axios from "axios";
import "./BookingChatInterface.css";
import FullCalendarComponent from "./FullCalendarComponent";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ChatUI from "../ChatUIComponent/ChatUI";
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
import { fetchUserEmailFromProfile } from "../../services/api";

interface Message {
  role: "user" | "assistant";
  content: string | JSX.Element;
  recommendations?: Recommendation[];
  showRecommendations?: boolean;
}

interface Recommendation {
  type?: string;
  score?: number;
  reason?: string;
  suggestion?: {
    room_id?: string;
    room_name?: string;
    capacity?: number;
    description?: string;
    start_time?: string;
    end_time?: string;
    confidence?: number;
  };
  data_source?: string;
}

const RECOMMENDATION_TYPES = {
  alternative_room: "🏢 Alternative Room",
  proactive: "🎯 Proactive Suggestion",
  smart_scheduling: "🧠 Smart Scheduling",
  default: "💡 Recommendation",
} as const;

const BookingChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  // const roomOptions = ["LT1", "LT2", "Lab1", "Lab2"]; // Add as needed
  // const moduleOptions = ["CE001", "CE002", "CS101", "ME202"];
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    room_name: "LT1",
    name:"",
    // module_code: '',
    date: "",
    start_time: "",
    end_time: "",
  });
  //remove
  const [sessionId] = useState("");

  const { theme } = useTheme();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [refreshCalendar, setRefreshCalendar] = useState(0);
  const [calendarCellInfo, setCalendarCellInfo] = useState<any>(null);
const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getEmail = async () => {
      const userEmail = await fetchUserEmailFromProfile();
      setEmail(userEmail);
       console.log(userEmail);
    };
    getEmail();
   
    
  }, []);
  // Called when chat updates
  const handleChatUpdate = () => {
    setRefreshCalendar((prev) => prev + 1); // increment to trigger refresh
  };

  const formatDate = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return timeString;
    }
  };

  const getDateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return { date: "N/A", timeRange: "N/A" };

    try {
      const date = formatDate(startTime);
      const startTimeFormatted = formatTime(startTime);
      const endTimeFormatted = formatTime(endTime);

      return {
        date,
        timeRange: `${startTimeFormatted} - ${endTimeFormatted}`,
      };
    } catch {
      return { date: "N/A", timeRange: "N/A" };
    }
  };

  const getRecommendationType = (type: string) => {
    return (
      RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES] ||
      RECOMMENDATION_TYPES.default
    );
  };

  const bookRecommendation = async (recommendation: Recommendation) => {
    if (!recommendation.suggestion) {
      console.error("No suggestion data available for booking");
      return;
    }

    const { room_name, start_time, end_time } = recommendation.suggestion!;

    if (!room_name || !start_time || !end_time) {
      console.error("Missing required booking data:", {
        room_name,
        start_time,
        end_time,
      });
      setError("Incomplete booking information. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      const date = startDate.toISOString().split("T")[0];
      const startTimeStr = startDate.toTimeString().slice(0, 5);
      const endTimeStr = endDate.toTimeString().slice(0, 5);

      console.log("Booking details:", {
        room_name,
        date,
        startTimeStr,
        endTimeStr,
      });

      const bookingMessage: Message = {
        role: "user",
        content: `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}`,
      };
      setMessages((prev) => [...prev, bookingMessage]);

      const response = await axios.post("http://127.0.0.1:8000/ask_llm/", {
        question: `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}`,
        session_id: sessionId,
      });

      console.log("Booking API Response:", response.data);

      let responseContent = "";

      if (response.data.message) {
        responseContent = response.data.message;
      }

      if (response.data.status === "available" || response.data.booking_id) {
        responseContent = `✅ Successfully booked ${room_name}! ${response.data.message}`;
      } else if (response.data.status === "unavailable") {
        responseContent = `⚠️ ${response.data.message}`;
      } else if (response.data.status === "room_not_found") {
        responseContent = `❌ ${response.data.message}`;
      } else if (response.data.status === "missing_parameters") {
        responseContent = `❓ ${response.data.message}`;
      }

      const responseMessage: Message = {
        role: "assistant",
        content:
          responseContent ||
          response.data.message ||
          "Booking processed successfully!",
        recommendations: response.data.recommendations || [],
        showRecommendations: false,
      };

      setMessages((prev) => [...prev, responseMessage]);
      handleChatUpdate();
    } catch (err) {
      console.error("Booking Error:", err);

      let errorMessage = "Failed to book the room. Please try again.";

      if (axios.isAxiosError(err) && err.response) {
        console.log("Error response data:", err.response.data);

        if (err.response.data?.detail) {
          if (typeof err.response.data.detail === "string") {
            errorMessage = `❌ ${err.response.data.detail}`;
          } else if (err.response.data.detail.message) {
            errorMessage = `❌ ${err.response.data.detail.message}`;
          }
        } else if (err.response.data?.message) {
          errorMessage = `❌ ${err.response.data.message}`;
        }
      }

      const errorResponseMessage: Message = {
        role: "assistant",
        content: errorMessage,
      };

      setMessages((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRecommendation = async (
    roomName: string,
    recommendation?: Recommendation
  ) => {
    if (recommendation) {
      await bookRecommendation(recommendation);
    } else {
      setInputValue(`Book ${roomName}`);
      setTimeout(() => sendMessage(), 100);
    }
  };

  const formatMessageWithRecommendations = (
    text: string,
    recommendations?: Recommendation[]
  ): JSX.Element => {
    return (
      <div>
        <div
          className={`recommendation-message-text ${
            recommendations && recommendations.length > 0
              ? "has-recommendations"
              : ""
          }`}
        >
          {text}
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="inline-recommendations">
            <div
              className={`recommendations-header ${theme ? "dark" : "light"}`}
            >
              📋 Available Options:
            </div>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`inline-recommendation-card ${
                    theme ? "dark" : "light"
                  }`}
                  onClick={() =>
                    handleBookRecommendation(
                      rec.suggestion?.room_name || "Unknown Room"
                    )
                  }
                >
                  <div className="recommendation-header">
                    <span
                      className={`recommendation-type-badge ${
                        theme ? "dark" : "light"
                      }`}
                    >
                      {getRecommendationType(rec.type || "recommendation")}
                    </span>
                    {rec.score && (
                      <span
                        className={`score-badge ${
                          rec.score >= 0.8
                            ? "high"
                            : rec.score >= 0.6
                            ? "medium"
                            : "low"
                        }`}
                      >
                        {Math.round(rec.score * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="room-header">
                    <h4 className={`room-name ${theme ? "dark" : "light"}`}>
                      {rec.suggestion?.room_name || "Unknown Room"}
                    </h4>

                    {rec.suggestion?.description && (
                      <p
                        className={`room-description ${
                          theme ? "dark" : "light"
                        }`}
                      >
                        {rec.suggestion.description}
                      </p>
                    )}
                  </div>

                  <div className="room-details">
                    {rec.suggestion?.capacity && (
                      <div
                        className={`detail-item ${theme ? "dark" : "light"}`}
                      >
                        <span className="detail-icon">👥</span>
                        <strong>Capacity : </strong> {rec.suggestion.capacity}{" "}
                        people
                      </div>
                    )}

                    {rec.suggestion?.start_time && rec.suggestion?.end_time && (
                      <>
                        <div
                          className={`detail-item date ${
                            theme ? "dark" : "light"
                          }`}
                        >
                          <span className="detail-icon">📅</span>
                          <strong>Date :</strong>{" "}
                          {
                            getDateTimeRange(
                              rec.suggestion.start_time,
                              rec.suggestion.end_time
                            ).date
                          }
                        </div>
                        <div
                          className={`detail-item time ${
                            theme ? "dark" : "light"
                          }`}
                        >
                          <span className="detail-icon">🕐</span>
                          <strong>Time :</strong>{" "}
                          {
                            getDateTimeRange(
                              rec.suggestion.start_time,
                              rec.suggestion.end_time
                            ).timeRange
                          }
                        </div>
                      </>
                    )}

                    {rec.reason && (
                      <div
                        className={`detail-item reason ${
                          theme ? "dark" : "light"
                        }`}
                      >
                        <span className="detail-icon">💡</span>
                        <span>
                          <strong>Why : </strong> {rec.reason}
                        </span>
                      </div>
                    )}

                    {rec.data_source && (
                      <div
                        className={`detail-item source ${
                          theme ? "dark" : "light"
                        }`}
                      >
                        <span className="detail-icon">🔍</span>
                        Source:{" "}
                        {rec.data_source
                          .replace("mysql_", "")
                          .replace("_", " ")}
                      </div>
                    )}
                  </div>

                  <button
                    className={`book-button ${theme ? "dark" : "light"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        "Book button clicked for:",
                        rec.suggestion?.room_name
                      );
                      handleBookRecommendation(
                        rec.suggestion?.room_name || "Unknown Room",
                        rec
                      );
                    }}
                    disabled={isLoading}
                  >
                    <span className="book-button-icon">📅</span>
                    {isLoading ? "Booking..." : "Book This Room"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/ask_llm/", {
        question: inputValue,
        session_id: sessionId,
      });

      console.log("Full API Response:", response.data);

      let responseContent = "";
      let recommendations: Recommendation[] = [];
      let showRecommendations = false;

      if (response.data.message) {
        responseContent = response.data.message;
      }

      if (
        response.data.recommendations &&
        response.data.recommendations.length > 0
      ) {
        recommendations = response.data.recommendations;
        showRecommendations = true;
      }

      if (
        response.data.status === "unavailable" ||
        response.data.status === "no_slots_available"
      ) {
        if (
          response.data.message &&
          response.data.message.includes("already booked for that time")
        ) {
          showRecommendations = true;
        }
      }

      if (response.data.status === "room_not_found") {
        responseContent = `❌ ${response.data.message}`;
        showRecommendations = false;
      } else if (response.data.status === "unavailable") {
        responseContent = `⚠️ ${response.data.message}`;
        showRecommendations =
          response.data.message &&
          response.data.message.includes("already booked for that time") &&
          recommendations.length > 0;
      } else if (response.data.status === "available") {
        responseContent = `✅ ${response.data.message}`;
      } else if (response.data.status === "missing_parameters") {
        responseContent = `❓ Please provide more information: ${response.data.message}`;
      } else if (response.data.status === "no_slots_available") {
        responseContent = `⚠️ ${response.data.message}`;
        showRecommendations =
          response.data.message &&
          response.data.message.includes("already booked for that time") &&
          recommendations.length > 0;
      }

      // Fake API call
      setTimeout(() => {
        const responseMessage: Message = {
          role: "assistant",
          content: showRecommendations
            ? formatMessageWithRecommendations(
                responseContent ||
                  "I couldn't process your request. Please try again.",
                recommendations
              )
            : responseContent || `${response.data.message}`,
          recommendations: recommendations,
          showRecommendations: showRecommendations,
        };
        setMessages((prev) => [...prev, responseMessage]);
        setIsLoading(false);
      }, 1000);
      handleChatUpdate();
    } catch (err) {
      console.error("API Error:", err);

      if (axios.isAxiosError(err) && err.response) {
        console.log("Error response data:", err.response.data);

        if (
          err.response.data?.detail &&
          typeof err.response.data.detail === "object"
        ) {
          let errorContent = `❌ ${
            err.response.data.detail.message || err.response.data.detail.error
          }`;
          let recommendations: Recommendation[] = [];
          let showRecommendations = false;

          if (
            err.response.data.detail.recommendations &&
            err.response.data.detail.recommendations.length > 0
          ) {
            recommendations = err.response.data.detail.recommendations;
            showRecommendations =
              errorContent.includes("already booked for that time") ||
              errorContent.includes("Here are some available alternatives");
          }

          const errorMessage: Message = {
            role: "assistant",
            content: showRecommendations
              ? formatMessageWithRecommendations(errorContent, recommendations)
              : errorContent,
            recommendations: recommendations,
            showRecommendations: showRecommendations,
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  const formatMessage = (text: string): string => {
    return text;
  };
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleUpdate = () => {
    console.log("✅ Creating booking:", formData);
    // Here you can call your API with formData
    // setIsOpen(false);
    updateBooking(calendarCellInfo.id, formData);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("info", calendarCellInfo);
    
  }, [messages]);

  const createBooking = async () => {
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/booking/add`,
        formData
      );
      console.log("✅ Booking created:", response.data);

      // Optionally, refresh the calendar or show a success message
    } catch (error) {
      console.error("❌ Error creating booking:", error);
    }
  };

  const deleteBooking = async (bookingId: number) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.delete(
        `http://127.0.0.1:8000/booking/delete`,
        {
          data: { booking_id: bookingId },
        }
      );
      console.log("✅ Booking deleted:", response.data);
handleChatUpdate();
      // Optionally, refresh the calendar or show a success message
    } catch (error) {
      console.error("❌ Error deleting booking:", error);
    }
  };

 const updateBooking = async (bookingId: number, updatedData: any) => {
  try {
    // ✅ Normalize date to YYYY-MM-DD
    let formattedDate = updatedData.date;
    if (formattedDate) {
      formattedDate = new Date(formattedDate).toISOString().split("T")[0]; 
      // e.g. "2025-08-18T09:38:40" → "2025-08-18"
    }

    const response = await axios.put(
      `http://127.0.0.1:8000/booking/update_booking`,
      {
        booking_id: bookingId,
        ...updatedData,
        date: formattedDate, // 👈 send normalized date
      }
    );

    console.log("✅ Booking updated:", response.data);
    handleChatUpdate();
  } catch (error) {
    console.error("❌ Error updating booking:", error);
  }
};


  const fetchBookingById = async (bookingId: number) => {
    console.log("calenderInfo",calendarCellInfo);
    
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/booking/fetch_booking_by_id`,
        {
          params: { booking_id: calendarCellInfo.id },
        }
      );
      console.log("✅ Booking fetched:", response.data);
      setFormData({
        room_name: response.data.room_name,
        name:response.data.name,
        // module_code: response.data.module_code,
        date: response.data.timestamp,
        start_time: response.data.start_time,
        end_time: response.data.end_time,
      });
      if(email)
      fetch_moduleCodes_by_user_email(email);
    fetch_halls_by_moduleCode(response.data.name);
      // Optionally, refresh the calendar or show a success message
    } catch (error) {
      console.error("❌ Error fetching booking:", error);
    }
  };
const fetch_moduleCodes_by_user_email = async (email: string) => {
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
useEffect(() => {
  if (calendarCellInfo) {
    fetchBookingById(calendarCellInfo.id);
    if(email)
    fetch_moduleCodes_by_user_email(email)
  }
}, [calendarCellInfo]);

  return (
    <div
      style={{ display: "flex", gap: "2rem", width: "100%", height: "100vh" }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <ChatUI
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          onClear={clearChat}
          onKeyPress={handleKeyPress}
          formatMessage={formatMessage}
          agentName="Booking Agent"
        />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h4>Booking Calendar</h4>
        <div
          className="calendar-scroll-container"
          style={theme === "dark" ? { background: "#383838" } : {}}
        >
          <style>{`
                .calendar-scroll-container .MuiInputLabel-root {
                  color: ${theme === "dark" ? "#e0baba" : "#5A3232"} !important;
                }
                .calendar-scroll-container .fc,
                .calendar-scroll-container .fc .fc-col-header-cell,
                .calendar-scroll-container .fc .fc-timegrid-axis,
                .calendar-scroll-container .fc .fc-event {
                  color: ${theme === "dark" ? "#f3f3f3" : "#5A3232"} !important;
                }
              `}</style>
          <FullCalendarComponent
            refreshKey={refreshCalendar}
            onCellClick={setCalendarCellInfo}
          />
        </div>
        {calendarCellInfo ? (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
          >
            <div
              className={`calendar-status-card${
                theme === "dark" ? " dark" : " light"
              }`}
              style={{
                borderRadius: 10,
                boxShadow:
                  theme === "dark"
                    ? "0 2px 12px rgba(30,30,60,0.25)"
                    : "0 2px 12px rgba(90,50,50,0.10)",
                padding: "1.2rem 2rem",
                minWidth: 260,
                border:
                  theme === "dark" ? "1px solid #333" : "1px solid #e1e1e1",
                background: theme === "dark" ? "#23232b" : "#fff",
                color: theme === "dark" ? "#f3f3f3" : "#222",
                textAlign: "center",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  color: theme === "dark" ? "#e0baba" : "#5A3232",
                }}
              >
                Selected Cell
              </div>
              {/* <div>Date: <b>{calendarCellInfo.date}</b></div>
              <div>All Day: <b>{calendarCellInfo.allDay ? 'Yes' : 'No'}</b></div> */}
              {calendarCellInfo && (
                <div>
                  Resource: <b>{calendarCellInfo.title}</b>
                </div>
              )}
              {calendarCellInfo ? (
                <>
                  <div>
                    Lecturer: <b>{calendarCellInfo.title || "N/A"}</b>
                  </div>
                  <div>
                    Hall: <b>{calendarCellInfo.id || "N/A"}</b>
                  </div>
                  <div>
                    Start Time:{" "}
                    <b>
                      {calendarCellInfo.startTime
                        ? new Date(
                            calendarCellInfo.startTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </b>
                  </div>
                  <div>
                    End Time:{" "}
                    <b>
                      {calendarCellInfo.endTime
                        ? new Date(calendarCellInfo.endTime).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </b>
                  </div>

                  {/* <div>Start Time: <b>{calendarCellInfo.startTime || 'N/A'}</b></div> */}
                  {/* <div>End Time: <b>{calendarCellInfo.endTime || 'N/A'}</b></div> */}
                </>
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    color: theme === "dark" ? "#aaa" : "#888",
                  }}
                >
                  No booking yet for this slot.
                </div>
              )}
              <Button
                onClick={() => {
                  setIsOpen(true);
                  fetchBookingById(calendarCellInfo.id);
                
                }}  
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
              {/* <Button
            onClick={() => deleteBooking(calendarCellInfo.id)}
            variant="contained"
            color="primary"
          >
            Delete
          </Button> */}
            </div>
          </div>
        ) : null}
      </div>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Booking</DialogTitle>
        <DialogContent>
          {/* Room Name */}
           <Box mb={2}>
            <FormControl fullWidth>
              <InputLabel>Module Code</InputLabel>
              <Select
               value={formData.name || ""}
               onChange={(e) => {handleChange("name", e.target.value);
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
                value={formData.room_name || ""}
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

          {/* Module Code */}
         

          {/* Date */}
          <Box mb={2}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={formData.date.slice(0, 10)}
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
              value={
                formData.start_time ? formData.start_time.slice(0, 5) : ""
              }
              onChange={(e) => handleChange("start_time", e.target.value)}
              inputProps={{ step: 300 }} // 5-minute steps
            />
            <TextField
              fullWidth
              type="time"
              label="End Time"
              InputLabelProps={{ shrink: true }}
              value={formData.end_time ? formData.end_time.slice(0, 5) : ""}
              onChange={(e) => handleChange("end_time", e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => handleUpdate()}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
          
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default BookingChatInterface;
