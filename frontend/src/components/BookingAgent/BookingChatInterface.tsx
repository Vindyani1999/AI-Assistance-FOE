import axios from "axios";
import "./BookingChatInterface.css";
import FullCalendarComponent from "./FullCalendarComponent";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ChatUI from "../ChatUIComponent/ChatUI";
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
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
  SelectChangeEvent,
} from "@mui/material";
import { useNotification } from '../../context/NotificationContext';
import { fetchUserEmailFromProfile, apiService } from "../../services/api";
import { getAccessToken } from '../../services/authAPI';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ===== INTERFACES ===== */
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

interface FormData {
  room_name: string;
  name: string;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

interface SwapData {
  date: string;
  name: string;
  start_time: string;
  end_time: string;
  id: number;
}

interface ValidationErrors {
  name: string;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

/* ===== CONSTANTS ===== */
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
  const [isSwap, setIsSwap] = useState(false);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [selectedRoomOptions, setSelectedRoomOptions] = useState<string[]>([]);
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const [refreshCalendar, setRefreshCalendar] = useState(0);
  const [calendarCellInfo, setCalendarCellInfo] = useState<any>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<{code: string; time: string; id: number}[]>([]);
  const [allRoomOptions, setAllRoomOptions] = useState<string[]>([]);
  const [showAllRooms, setShowAllRooms] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    room_name: "LT1",
    name: "",
    room_id: 0,
    date: "",
    start_time: "",
    end_time: "",
  });

  const [swapData, setSwapData] = useState<SwapData>({
    date: "",
    name: "",
    id: 0,
    start_time: "",
    end_time: ""
  });

  const [updateErrors, setUpdateErrors] = useState<ValidationErrors>({
    name: "",
    room_name: "",
    date: "",
    start_time: "",
    end_time: "",
  });
  
  const { notify } = useNotification();
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const [sessionId] = useState(() => 
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    const getEmail = async () => {
      const userEmail = await fetchUserEmailFromProfile();
      setEmail(userEmail);
    };
    getEmail();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // useEffect(() => {
  //   if (calendarCellInfo) {
  //     if (email) {
  //     fetch_moduleCodes_by_user_email(email);
  //     fetch_all_halls();
  //   }
  //   }
  // }, [calendarCellInfo]);

  useEffect(() => {
  const loadDialogData = async () => {
    if (calendarCellInfo && email) {
      console.log("Dialog opened, loading data...");
      
      const modules = await fetch_moduleCodes_by_user_email(email);
      console.log(" Modules loaded:", modules);
      
      const rooms = await fetch_all_halls();
      console.log(" All rooms loaded:", rooms);
    }
  };
  
  loadDialogData();
}, [calendarCellInfo, email]);

  const handleChatUpdate = () => setRefreshCalendar((prev) => prev + 1);

  const formatDate = (timeString: string): string => {
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

  const formatTime = (timeString: string): string => {
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
    return RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES] || RECOMMENDATION_TYPES.default;
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const validateUpdateField = (field: string, value: string): string => {
    switch (field) {
      case "name":
        return !value ? "Module code is required" : "";
      case "room_name":
        return !value ? "Room selection is required" : "";
      case "date":
        if (!value) return "Date is required";
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today ? "Cannot book past dates" : "";
      case "start_time":
        return !value ? "Start time is required" : "";
      case "end_time":
        if (!value) return "End time is required";
        if (formData.start_time && value <= formData.start_time) {
          return "End time must be after start time";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateUpdateField(field, value);
    setUpdateErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSwapChange = (field: string, value: string) => {
    setSwapData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (e: SelectChangeEvent<number | string>) => {
    const raw = e.target.value;
    const selectedId = typeof raw === "string" ? Number(raw) : (raw as number);
    const selectedOption = bookingOptions.find((o) => o.id === selectedId);
    
    if (selectedOption) {
      setSwapData((prev) => ({
        ...prev,
        id: selectedId,
        name: selectedOption.code,
        start_time: selectedOption.time.split(' - ')[0],
        end_time: selectedOption.time.split(' - ')[1],
      }));
    }
  };

  const handleDateChange = async (date: string) => {
    setSwapData((prev) => ({
      ...prev,
      date: date,
      name: '',
      start_time: '',
      end_time: ''
    }));

    if (formData.room_id) {
      const bookings = await fetch_booking_by_date_and_roomId(date, formData.room_id);
      if (bookings) {
        const options = bookings.map((b: any) => ({
          code: b.name,
          time: `${b.start_time} - ${b.end_time}`,
          id: b.id
        }));
        setBookingOptions(options);
      }
    }
  };

  const handleCloseUpdateDialog = () => {
    setIsOpen(false);
    setShowAllRooms(false);
    setUpdateErrors({
      name: "",
      room_name: "",
      date: "",
      start_time: "",
      end_time: "",
    });
  };

  const handleUpdate = () => {
    const newErrors: ValidationErrors = {
      name: validateUpdateField("name", formData.name),
      room_name: validateUpdateField("room_name", formData.room_name),
      date: validateUpdateField("date", formData.date),
      start_time: validateUpdateField("start_time", formData.start_time),
      end_time: validateUpdateField("end_time", formData.end_time),
    };

    setUpdateErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      notify("warning", "⚠️ Please fix all errors before updating.");
      return;
    }

    updateBooking(calendarCellInfo.id, formData);
  };

  /* ===== API CALLS ===== */
  const fetch_moduleCodes_by_user_email = async (email: string) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_HBA_URL}/booking/fetch_moduleCodes_by_user_email?email=${email}`);
      setModuleOptions(response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching module codes:", error);
      return [];
    }
  };

const fetch_all_halls = async () => {
  try {
    console.log("🔍 Fetching all halls...");
    const response = await axios.get(`${process.env.REACT_APP_HBA_URL}/booking/all_halls`);
    console.log("✅ Fetched all halls:", response.data);
    setAllRoomOptions(response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching all halls:", error);
    setAllRoomOptions([]);
    return [];
  }
};

  const fetch_halls_by_moduleCode = async (moduleCode: string) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_HBA_URL}/booking/fetch_halls_by_moduleCode?module_code=${moduleCode}`);
      setSelectedRoomOptions(response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching halls:", error);
      return [];
    }
  };

  const fetch_booking_by_date_and_roomId = async (date: string, roomId: number) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_HBA_URL}/bookings/by-date/${date}/${roomId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching booking:", error);
      return null;
    }
  };

  const fetchBookingById = async (bookingId: number) => {
  try {
    setIsUpdating(true);
    
    const response = await axios.get(
      `${process.env.REACT_APP_HBA_URL}/booking/fetch_booking_by_id`,
      { params: { booking_id: bookingId } }
    );

    const bookingData = response.data;

    // Fetch module-specific rooms if module code exists
    if (bookingData.name) {
      await fetch_halls_by_moduleCode(bookingData.name);
    }

    setFormData({
      room_name: bookingData.room_name,
      name: bookingData.name,
      room_id: bookingData.room_id,
      date: bookingData.timestamp,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
    });
    
    // Make sure module codes are loaded
    if (email) {
      await fetch_moduleCodes_by_user_email(email);
    }
    
    // Ensure all rooms are loaded (don't refetch if already loaded)
    if (allRoomOptions.length === 0) {
      await fetch_all_halls();
    }
    
    setIsUpdating(false);
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    notify('error', "❌ Failed to fetch booking details");
    setIsUpdating(false);
  }
};

  const deleteBooking = async (bookingId: number) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_HBA_URL}/booking/delete`,
        {
          data: { booking_id: bookingId },
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      notify('success', "✅ Booking deleted successfully!");
      handleChatUpdate();
    } catch (error: any) {
      let errorMessage = `❌ Failed to delete booking: ${error.response?.data?.message || error.message}`;
      
      if (error.response?.status === 403) {
        errorMessage = "🔒 Access denied. You can only delete bookings you created.";
      } else if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
        errorMessage = `❌ ${error.response.data.detail}`;
      }
      
      notify('error', errorMessage);
      console.error("❌ Error deleting booking:", error);
    }
  };

  const updateBooking = async (bookingId: number, updatedData: any) => {
    setIsUpdating(true);
    try {
      let formattedDate = updatedData.date;
      if (formattedDate) {
        formattedDate = new Date(formattedDate).toISOString().split("T")[0];
      }

      await axios.put(
        `${process.env.REACT_APP_HBA_URL}/booking/update_booking`,
        {
          booking_id: bookingId,
          ...updatedData,
          date: formattedDate,
        },
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      notify('success', "✅ Booking updated successfully!");
      handleChatUpdate();
      handleCloseUpdateDialog();
    } catch (error: any) {
      let errorMessage = `❌ Failed to update booking: ${error.response?.data?.message || error.message}`;
      
      if (error.response?.status === 403) {
        errorMessage = "🔒 Access denied. You can only update bookings you created.";
      } else if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
        errorMessage = `❌ ${error.response.data.detail}`;
      }
      
      notify('error', errorMessage);
      console.error("❌ Error updating booking:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const create_swap_request = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_HBA_URL}/swap/request`, {
        requested_by_email: email,
        requested_booking_id: Number(calendarCellInfo.id),
        offered_booking_id: Number(swapData.id)
      });
      notify('success', "✅ Swap request created successfully!");
      setIsSwap(false);
    } catch (error) {
      notify('error', "❌ Failed to create swap request.");
      console.error("Error creating swap request:", error);
    }
  };

  const bookRecommendation = async (recommendation: Recommendation) => {
    if (!recommendation.suggestion) {
      console.error("No suggestion data available for booking");
      return;
    }

    const { room_name, start_time, end_time } = recommendation.suggestion;

    if (!room_name || !start_time || !end_time) {
      console.error("Missing required booking data:", { room_name, start_time, end_time });
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

      const bookingMessage: Message = {
        role: "user",
        content: `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}`,
      };
      setMessages((prev) => [...prev, bookingMessage]);

      const response = await apiService.askLLM(
        sessionId, 
        `Book ${room_name} on ${date} from ${startTimeStr} to ${endTimeStr}`
      );

      let responseContent = response.message || "";

      if (response.status === "available" || response.booking_id) {
        responseContent = `✅ Successfully booked ${room_name}! ${response.message}`;
      } else if (response.status === "unavailable") {
        responseContent = `⚠️ ${response.message}`;
      } else if (response.status === "room_not_found") {
        responseContent = `❌ ${response.message}`;
      } else if (response.status === "missing_parameters") {
        responseContent = `❓ ${response.message}`;
      }

      const responseMessage: Message = {
        role: "assistant",
        content: responseContent || "Booking processed successfully!",
        recommendations: response.recommendations || [],
        showRecommendations: false,
      };

      setMessages((prev) => [...prev, responseMessage]);
      handleChatUpdate();
    } catch (err) {
      console.error("Booking Error:", err);

      let errorMessage = "Failed to book the room. Please try again.";

      if (axios.isAxiosError(err) && err.response) {
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

      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
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
        <div className={`recommendation-message-text ${recommendations && recommendations.length > 0 ? "has-recommendations" : ""}`}>
          {text}
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="inline-recommendations">
            <div className={`recommendations-header ${theme ? "dark" : "light"}`}>
              📋 Available Options:
            </div>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`inline-recommendation-card ${theme ? "dark" : "light"}`}
                  onClick={() => handleBookRecommendation(rec.suggestion?.room_name || "Unknown Room")}
                >
                  <div className="recommendation-header">
                    <span className={`recommendation-type-badge ${theme ? "dark" : "light"}`}>
                      {getRecommendationType(rec.type || "recommendation")}
                    </span>
                    {rec.score && (
                      <span className={`score-badge ${rec.score >= 0.8 ? "high" : rec.score >= 0.6 ? "medium" : "low"}`}>
                        {Math.round(rec.score * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="room-header">
                    <h4 className={`room-name ${theme ? "dark" : "light"}`}>
                      {rec.suggestion?.room_name || "Unknown Room"}
                    </h4>
                    {rec.suggestion?.description && (
                      <p className={`room-description ${theme ? "dark" : "light"}`}>
                        {rec.suggestion.description}
                      </p>
                    )}
                  </div>

                  <div className="room-details">
                    {rec.suggestion?.capacity && (
                      <div className={`detail-item ${theme ? "dark" : "light"}`}>
                        <span className="detail-icon">👥</span>
                        <strong>Capacity : </strong> {rec.suggestion.capacity} people
                      </div>
                    )}

                    {rec.suggestion?.start_time && rec.suggestion?.end_time && (
                      <>
                        <div className={`detail-item date ${theme ? "dark" : "light"}`}>
                          <span className="detail-icon">📅</span>
                          <strong>Date :</strong> {getDateTimeRange(rec.suggestion.start_time, rec.suggestion.end_time).date}
                        </div>
                        <div className={`detail-item time ${theme ? "dark" : "light"}`}>
                          <span className="detail-icon">🕐</span>
                          <strong>Time :</strong> {getDateTimeRange(rec.suggestion.start_time, rec.suggestion.end_time).timeRange}
                        </div>
                      </>
                    )}

                    {rec.reason && (
                      <div className={`detail-item reason ${theme ? "dark" : "light"}`}>
                        <span className="detail-icon">💡</span>
                        <span><strong>Why : </strong> {rec.reason}</span>
                      </div>
                    )}

                    {rec.data_source && (
                      <div className={`detail-item source ${theme ? "dark" : "light"}`}>
                        <span className="detail-icon">🔍</span>
                        Source: {rec.data_source.replace("mysql_", "").replace("_", " ")}
                      </div>
                    )}
                  </div>

                  <button
                    className={`book-button ${theme ? "dark" : "light"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookRecommendation(rec.suggestion?.room_name || "Unknown Room", rec);
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

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.askLLM(sessionId, inputValue);

      let responseContent = response.message || "";
      let recommendations: Recommendation[] = response.recommendations || [];
      
      let showRecommendations = recommendations.length > 0;

      console.log("🔍 API Response:", {
        status: response.status,
        message: response.message,
        recommendationsCount: recommendations.length,
        recommendations: recommendations
      });

      if (response.status === "room_not_found") {
        responseContent = `❌ ${response.message}`;
      } else if (response.status === "unavailable") {
        responseContent = `⚠️ ${response.message}`;
      } else if (response.status === "available") {
        responseContent = `✅ ${response.message}`;
      } else if (response.status === "missing_parameters") {
        responseContent = `❓ Please provide more information: ${response.message}`;
      } else if (response.status === "no_slots_available") {
        responseContent = `⚠️ ${response.message}`;
      }

      const responseMessage: Message = {
        role: "assistant",
        content: showRecommendations
          ? formatMessageWithRecommendations(
              responseContent || "I couldn't process your request. Please try again.", 
              recommendations
            )
          : responseContent || `${response.message}`,
        recommendations: recommendations,
        showRecommendations: showRecommendations,
      };

      setMessages((prev) => [...prev, responseMessage]);
      handleChatUpdate();
    } catch (err) {
      console.error("API Error:", err);

      let errorContent = "❌ Something went wrong. Please try again.";
      let recommendations: Recommendation[] = [];
      let showRecommendations = false;
      
      if (err instanceof Error && err.message.includes('Access denied')) {
        errorContent = `🔒 ${err.message}`;
      } else if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          errorContent = `🔒 Access denied. You can only modify bookings you created.`;
        } else if (err.response.data?.detail && typeof err.response.data.detail === "object") {
          errorContent = `❌ ${err.response.data.detail.message || err.response.data.detail.error}`;
          
          if (err.response.data.detail.recommendations?.length > 0) {
            recommendations = err.response.data.detail.recommendations;
            showRecommendations = true; 
            
            console.log("📋 Error contains recommendations:", recommendations);
          }
        } else if (err.response.data?.detail && typeof err.response.data.detail === "string") {
          errorContent = `❌ ${err.response.data.detail}`;
        } else {
          errorContent = `❌ Error ${err.response.status}: ${err.response.statusText}`;
        }
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
    } finally {
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

  const formatMessage = (text: string): string => text;

const renderFormField = (
  label: string,
  field: keyof FormData,
  type: "select" | "date" | "time",
  options?: string[],
  disabled?: boolean,
  helperText?: string
) => {
  const isError = !!updateErrors[field as keyof ValidationErrors];
  const errorMessage = updateErrors[field as keyof ValidationErrors];

  if (type === "select") {
    if (field === "room_name") {
      const roomsToShow = showAllRooms ? allRoomOptions : selectedRoomOptions;

      return (
        <div className="dialog-form-field">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <label className="dialog-form-label">{label} *</label>
            <Button
              size="small"
              onClick={() => {
                setShowAllRooms(showAllRooms);
              }}
              style={{
                textTransform: 'none',
                fontSize: '12px',
                padding: '4px 8px',
                minWidth: 'auto',
                backgroundColor: showAllRooms ? '#047857' : '#968d8dff',
                color: 'white'
              }}
            >
              {showAllRooms ? '🔍 Show Module Rooms' : '🏢 Show All Rooms'}
            </Button>
          </div>
          
          <FormControl 
            fullWidth 
            error={isError} 
            disabled={disabled || isUpdating} 
            className="dialog-form-control"
          >
            <InputLabel sx={{ fontSize: "14px" }}>{label}</InputLabel>
            <Select
              value={formData[field] || ""}
              onChange={(e) => {
                const value = String(e.target.value);
                handleChange(field, value);
              }}
              className="dialog-select"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    overflow: 'auto'
                  }
                }
              }}
            >
              {roomsToShow && roomsToShow.length > 0 ? (
                roomsToShow.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  {showAllRooms 
                    ? (allRoomOptions.length === 0 ? "Loading all rooms..." : "No rooms available")
                    : !formData.name 
                      ? "Select module code first or click 'Show All Rooms'"
                      : "No module-specific rooms found"}
                </MenuItem>
              )}
            </Select>
            
            {errorMessage && (
              <p className="dialog-helper-text error">{errorMessage}</p>
            )}
            {!errorMessage && helperText && (
              <p className="dialog-helper-text info">{helperText}</p>
            )}
            {showAllRooms && roomsToShow.length > 0 && (
              <p className="dialog-helper-text info" style={{ 
                marginTop: '4px', 
                fontSize: '11px',
                color: '#047857'
              }}>
                 Showing all {roomsToShow.length} available rooms
              </p>
            )}
            {!showAllRooms && roomsToShow.length > 0 && (
              <p className="dialog-helper-text info" style={{ 
                marginTop: '4px', 
                fontSize: '11px',
                color: '#968d8dff'
              }}>
                Showing {roomsToShow.length} module-specific rooms
              </p>
            )}
          </FormControl>
        </div>
      );
    }

    return (
      <div className="dialog-form-field">
        <label className="dialog-form-label">{label} *</label>
        <FormControl 
          fullWidth 
          error={isError} 
          disabled={disabled || isUpdating} 
          className="dialog-form-control"
        >
          <InputLabel sx={{ fontSize: "14px" }}>{label}</InputLabel>
          <Select
            value={formData[field] || ""}
            onChange={async (e) => {
              const value = String(e.target.value);
              handleChange(field, value);
              
              if (field === "name") {
                setSelectedRoomOptions([]); 
                await fetch_halls_by_moduleCode(value);
              }
            }}
            className="dialog-select"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  overflow: 'auto'
                }
              }
            }}
          >
            {options && options.length > 0 ? (
              options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                No options available
              </MenuItem>
            )}
          </Select>
          {errorMessage && (
            <p className="dialog-helper-text error">{errorMessage}</p>
          )}
          {!errorMessage && helperText && (
            <p className="dialog-helper-text info">{helperText}</p>
          )}
        </FormControl>
      </div>
    );
  }

  return (
    <div className="dialog-form-field">
      <TextField
        fullWidth
        type={type}
        label={label}
        value={type === "time" 
          ? (formData[field] ? (formData[field] as string).slice(0, 5) : "") 
          : (formData[field] as string).slice(0, 10)}
        onChange={(e) => handleChange(field, e.target.value)}
        error={isError}
        disabled={isUpdating}
        InputLabelProps={{ shrink: true }}
        inputProps={type === "date" ? { min: getTodayDate() } : type === "time" ? { step: 300 } : {}}
        InputProps={
          type === "date" || type === "time"
            ? {
                onClick: (e: any) => {
                  const el = (e.target as HTMLInputElement) || (e.currentTarget?.querySelector('input') as HTMLInputElement);
                  if (el?.showPicker) {
                    try {
                      el.showPicker();
                    } catch {}
                  }
                },
                onFocus: (e: any) => {
                  const el = (e.target as HTMLInputElement) || (e.currentTarget?.querySelector('input') as HTMLInputElement);
                  if (el?.showPicker) {
                    try {
                      el.showPicker();
                    } catch {}
                  }
                },
              }
            : undefined
        }
        helperText={errorMessage}
        className="dialog-input"
      />
    </div>
  );
};

  const renderSwapFormField = (
    label: string,
    type: "select" | "date" | "time",
    value: string | number,
    onChange: (value: string) => void,
    options?: Array<{ id: number; code: string; time: string }> | string[],
    disabled?: boolean
  ) => {
    if (type === "select") {
      return (
        <FormControl fullWidth disabled={disabled} className="dialog-form-control">
          <InputLabel>{label}</InputLabel>
          <Select
            value={value || ""}
            onChange={(e) => onChange(e.target.value as string)}
            className="dialog-select"
          >
            {Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && 'id' in options[0]
              ? (options as Array<{ id: number; code: string; time: string }>).map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.code} ({option.time})
                  </MenuItem>
                ))
              : (options as string[])?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth
        type={type}
        label={label}
        value={type === "time" ? (value ? String(value).slice(0, 5) : "") : String(value).slice(0, 10)}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={type === "time" ? { step: 300 } : {}}
        className="dialog-input"
      />
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem", width: "100%", height: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh" }} className="booking-chat-wrapper">
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
      </div>

      {/* Calendar Section */}
      <div style={{ flex: 1, minWidth: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div
          className="calendar-scroll-container"
          style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
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

        {/* Selected Cell Info */}
        {calendarCellInfo && (
          <div>
            <div className={`calendar-status-card${theme === "dark" ? " dark" : " light"}`}>
              <div className="selected-cell-container">
                <div className="selected-cell-card">
                  <div className="selected-cell-header">
                    <div className="selected-cell-icon">
                      <CalendarMonthIcon sx={{ fontSize: 24 }} />
                    </div>
                    <div className="selected-cell-title-group">
                      <h3 className="selected-cell-title">Booking Details</h3>
                      <p className="selected-cell-subtitle">Selected time slot information</p>
                    </div>
                    <button 
                      className="selected-cell-close-btn"
                      onClick={() => {
                        setCalendarCellInfo(null);
                        setLastClicked(null);
                      }}
                      aria-label="Close"
                    >
                      <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                  </div>

                  <div className="selected-cell-details">
                    {calendarCellInfo.title && (
                      <div className="detail-row">
                        <div className="detail-label">
                          <span className="detail-icon">👨‍🏫</span>
                          Module Code
                        </div>
                        <div className="detail-value">{calendarCellInfo.title}</div>
                      </div>
                    )}

                    {calendarCellInfo.id && (
                      <div className="detail-row">
                        <div className="detail-label">
                          <span className="detail-icon">🏛️</span>
                          Hall
                        </div>
                        <div className="detail-value">{calendarCellInfo.id}</div>
                      </div>
                    )}

                    {calendarCellInfo.startTime && (
                      <div className="detail-row">
                        <div className="detail-label">
                          <span className="detail-icon">🕐</span>
                          Start Time
                        </div>
                        <div className="detail-value time-value">
                          {new Date(calendarCellInfo.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )}

                    {calendarCellInfo.endTime && (
                      <div className="detail-row">
                        <div className="detail-label">
                          <span className="detail-icon">🕐</span>
                          End Time
                        </div>
                        <div className="detail-value time-value">
                          {new Date(calendarCellInfo.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="selected-cell-actions">
                    <Button
                      onClick={async () => {
                        await fetchBookingById(calendarCellInfo.id);
                        setIsOpen(true);
                      }}
                      className="cell-action-btn cell-action-edit"
                      startIcon={<EditIcon />}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Loading..." : "Edit Booking"}
                    </Button>

                    {moduleOptions.some((m) => String(m).toLowerCase().trim() === String(calendarCellInfo.title).toLowerCase().trim()) && (
                      <Button
                        onClick={async () => {
                          await fetchBookingById(calendarCellInfo.id);
                          setIsSwap(true);
                        }}
                        className="cell-action-btn cell-action-swap"
                        startIcon={<SwapHorizIcon />}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Loading..." : "Request Swap"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Booking Dialog */}
      <Dialog
        open={isOpen}
        onClose={handleCloseUpdateDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          className: `booking-dialog ${theme === "dark" ? "dark" : ""}`,
        }}
      >
        <DialogTitle className="dialog-header">
          <EditIcon className="dialog-header-icon" />
          <h3 className="dialog-header-title">Update Booking</h3>
        </DialogTitle>

        <DialogContent className="dialog-content">
          {renderFormField("Module Code", "name", "select", moduleOptions)}
          {/* {renderFormField("Room Name", "room_name", "select", selectedRoomOptions, !formData.name, !formData.name ? "Select module code first" : undefined)} */}
          {renderFormField("Room Name", "room_name", "select")}
          {renderFormField("Booking Date", "date", "date")}

          <div className="dialog-field-row">
            {renderFormField("Start Time", "start_time", "time")}
            {renderFormField("End Time", "end_time", "time")}
          </div>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <Button
            onClick={handleCloseUpdateDialog}
            disabled={isUpdating}
            className="dialog-btn dialog-btn-cancel"
          >
            Cancel
          </Button>

          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={isUpdating}
            className="dialog-btn dialog-btn-primary"
          >
            {isUpdating ? "Updating..." : "Update Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Swap Booking Dialog */}
      <Dialog
        open={isSwap}
        onClose={() => setIsSwap(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          className: `booking-dialog ${theme === "dark" ? "dark" : ""}`,
        }}
      >
        <DialogTitle className="dialog-header">
          <SwapHorizIcon className="dialog-header-icon" />
          <h3 className="dialog-header-title">Swap Booking</h3>
        </DialogTitle>

        <DialogContent className="dialog-content">
          <div className="dialog-field-row">
            {renderSwapFormField("Module Code", "select", formData.name, (val) => {
              handleChange("name", val);
              fetch_halls_by_moduleCode(val);
            }, moduleOptions)}

            {renderSwapFormField("Room Name", "select", formData.room_name, (val) => handleChange("room_name", val), selectedRoomOptions, !formData.name)}

            {renderSwapFormField("Date", "date", formData.date, (val) => handleChange("date", val))}
          </div>

          <div className="dialog-field-row">
            {renderSwapFormField("Start Time", "time", formData.start_time, (val) => handleChange("start_time", val))}
            {renderSwapFormField("End Time", "time", formData.end_time, (val) => handleChange("end_time", val))}
          </div>

          <h4 className="dialog-section-title">Swap With</h4>

          <div className="dialog-field-row">
            {renderSwapFormField("Date", "date", swapData.date, handleDateChange)}
            {renderSwapFormField("Module & Time", "select", swapData.id, (val) => {
              const selectedId = Number(val);
              const selectedOption = bookingOptions.find((o) => o.id === selectedId);
              if (selectedOption) {
                setSwapData((prev) => ({
                  ...prev,
                  id: selectedId,
                  name: selectedOption.code,
                  start_time: selectedOption.time.split(' - ')[0],
                  end_time: selectedOption.time.split(' - ')[1],
                }));
              }
            }, bookingOptions)}
          </div>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <Button onClick={() => setIsSwap(false)} className="dialog-btn dialog-btn-cancel">
            Cancel
          </Button>
          <Button onClick={create_swap_request} variant="contained" className="dialog-btn dialog-btn-secondary">
            Request Swap
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookingChatInterface;