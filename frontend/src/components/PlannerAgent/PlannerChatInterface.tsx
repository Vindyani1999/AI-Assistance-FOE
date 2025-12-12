import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import "../BookingAgent/BookingChatInterface.css";
import BackupIcon from "@mui/icons-material/Backup";
import DescriptionIcon from "@mui/icons-material/Description";
import PlannerScreen from "./plannerScreen";
import ExamTimeTable from "./ExamTimeTable2";
import axios from "axios";
import { useNotification } from "../../context/NotificationContext";

// import Home from "./Home";

const PlannerChatInterface: React.FC = () => {
  const { notify } = useNotification();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [selectedView, setSelectedView] = useState<"academic" | "exam">(
    "academic"
  );

  // Upload / generate / download helpers (no persistent storage)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);
  const [lastDownloadName, setLastDownloadName] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
   const [selectedFile, setSelectedFile] = React.useState<File | null>(null)  ;


const handleFileChangee = (even: any) => {
    setSelectedFile(even.target.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setUploadedFileName(f.name);
      setUploadedFile(f);
      // We could parse here if needed. For now we just keep the name.
    }
  };
 

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) {
      setUploadedFileName(f.name);
      setUploadedFile(f);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
   
  const [firstExamFile, setFirstExamFile] = React.useState<File | null>(null);
  const handleExamFileChange = (event:any) => {
    setFirstExamFile(event.target.files[0]);
  };

  const generateTimetable = () => {
    // Create a small CSV placeholder to download (no persistent storage)
    const mode = selectedView === "academic" ? "Academic" : "Exam";
    const csv = "Time,Mon,Tue,Wed,Thu,Fri\n08:00-09:00,,,,,\n";
    const blob = new Blob([`# ${mode} Timetable\n`, csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    // revoke previous url
    if (lastDownloadUrl) URL.revokeObjectURL(lastDownloadUrl);
    setLastDownloadUrl(url);
    setLastDownloadName(`${mode}-timetable-${new Date().toISOString()}.csv`);
  };
const handleUpload = async () => {
  setIsFetching(false);
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      if (selectedView === "academic") {
        const response = await axios.post(
        process.env.REACT_APP_PLANNER_URL + "/api/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // alert(response.data);
      await setIsFetching(true);
      }else if (selectedView === "exam") {
        const response = await axios.post(
        process.env.REACT_APP_PLANNER_URL + "/api/uploadExam",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // alert(response.data);
      await setIsFetching(true);
      }
      notify("success", "Upload successful", "Your file has been uploaded.");
      
      // await getCalenderData(); // Refresh timetable
    } catch (error: any) {
      const message =
        error.response?.data || "Upload failed. Please try again.";
      alert(message);
      console.error("Upload failed:", error);
    }
  };
  // const handleExamUpload = async () => {
  //   if (!firstExamFile) {
  //     alert("Please select a file first.");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("file", firstExamFile);

  //   try {
  //     const response = await axios.post(
  //       process.env.REACT_APP_PLANNER_URL + "/api/uploadExam",
  //       formData,
  //       { headers: { "Content-Type": "multipart/form-data" } }
  //     );
  //     alert(response.data);
  //     // await getCalenderData(); // Refresh timetable
  //   } catch (error: any) {
  //     const message =
  //       error.response?.data || "Upload failed. Please try again.";
  //     alert(message);
  //     console.error("Upload failed:", error);
  //   }
  // };
  const triggerDownload = () => {
    if (!lastDownloadUrl || !lastDownloadName) return;
    const a = document.createElement("a");
    a.href = lastDownloadUrl;
    a.download = lastDownloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (lastDownloadUrl) URL.revokeObjectURL(lastDownloadUrl);
    };
  }, [lastDownloadUrl]);

  // no dropdowns required per latest spec

  // no chat functions in planner view

  return (
    <div
      className={`chat-interface ${isDarkTheme ? "dark-theme" : "light-theme"}`}
      style={
        isDarkTheme
          ? { background: "#383838", display: "flex", minHeight: "100vh" }
          : { display: "flex", minHeight: "100vh" }
      }
    >
      {/* <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Home />
      </div> */}
      <div style={{ flex: 2, display: "flex", gap: 16 }}>
        {/* Middle: top-left toggle and generation area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "1.5rem",
          }}
        >
          {/* Toggle placed top-left */}
          <div
            style={{ display: "flex", justifyContent: "flex-start", gap: 12 }}
          >
            <button
              onClick={() => setSelectedView("academic")}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border:
                  selectedView === "academic"
                    ? "2px solid var(--brand-500)"
                    : "1px solid rgba(0,0,0,0.08)",
                background:
                  selectedView === "academic"
                    ? isDarkTheme
                      ? "#2b2f32"
                      : "#fff"
                    : "transparent",
                color: isDarkTheme ? "#eaf3ff" : "#222",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Academic
            </button>

            <button
              onClick={() => setSelectedView("exam")}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border:
                  selectedView === "exam"
                    ? "2px solid var(--brand-500)"
                    : "1px solid rgba(0,0,0,0.08)",
                background:
                  selectedView === "exam"
                    ? isDarkTheme
                      ? "#2b2f32"
                      : "#fff"
                    : "transparent",
                color: isDarkTheme ? "#eaf3ff" : "#222",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Exam
            </button>
          </div>

          {/* Upload & Generate buttons — top of page */}
          {/* <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <button
              onClick={handleUploadClick}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--brand-500)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Upload File
            </button>
            <button
              onClick={generateTimetable}
              disabled={!uploadedFile}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: uploadedFile
                  ? selectedView === "academic"
                    ? "var(--brand-500)"
                    : "var(--brand-700)"
                  : "rgba(0,0,0,0.06)",
                color: uploadedFile ? "#fff" : "#999",
                border: "none",
                cursor: uploadedFile ? "pointer" : "not-allowed",
              }}
            >
              Generate Timetable
            </button>
          </div> */}

          {/* Main timetable layout area — shows table/layout related to selected view */}
          <div
            style={{
              flex: 1,
              marginTop: 12,
              background: isDarkTheme ? "#23232b" : "#fff",
              borderRadius: 10,
              padding: 16,
              boxShadow: isDarkTheme
                ? "0 6px 18px rgba(0,0,0,0.6)"
                : "0 6px 18px rgba(16,24,40,0.04)",
              minHeight: 480,
            }}
          >
            <h3
              style={{ marginTop: 0, color: isDarkTheme ? "#eaf3ff" : "#222" }}
            >
              {selectedView === "academic"
                ? "Academic Timetable Layout"
                : "Exam Timetable Layout"}
            </h3>
            <p style={{ color: isDarkTheme ? "#cfcfcf" : "#555" }}>
              This area shows the timetable grid and layout for the selected
              mode. Use the upload/generate controls above to create timetables.
            </p>
            <div
              style={{
                marginTop: 12,
                height: "100%",
                borderRadius: 8,
                background: isDarkTheme ? "#1a1d21" : "#fafafa",
                overflow: "auto",
              }}
            >
              {selectedView === "academic" ? (
                <PlannerScreen isFetching={isFetching} />
              ) : (
                <ExamTimeTable isFetching={isFetching} />
              )}
            </div>
          </div>
        </div>

        {/* Right: full-height controls (upload / generate / download) */}
        <div
          style={{
            width: 360,
            background: isDarkTheme ? "#0f1417" : "#fafafa",
            padding: 18,
            borderRadius: 10,
            height: "100vh",
            overflowY: "auto",
            boxShadow: isDarkTheme
              ? "0 0 0 1px rgba(255,255,255,0.02) inset"
              : "0 6px 18px rgba(16,24,40,0.04)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <h3 style={{ marginTop: 0, color: isDarkTheme ? "#eaf3ff" : "#222" }}>
            Timetable Controls
          </h3>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                marginBottom: 12,
                color: isDarkTheme ? "#cfcfcf" : "#555",
              }}
            >
              Mode:{" "}
              <strong>
                {selectedView === "academic" ? "Academic" : "Exam"}
              </strong>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  marginBottom: 30,
                  color: isDarkTheme ? "#9aa" : "#777",
                }}
              >
                {/* Upload (drag & drop or click) */}
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed rgba(107,75,58,0.35)`,
                  padding: 12,
                  borderRadius: 8,
                  background: isDragging
                    ? "rgba(107,75,58,0.28)"
                    : "rgba(107,75,58,0.20)",
                  color: isDarkTheme ? "#fff" : "var(--brand-700)",
                  height: "50vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 14,
                  cursor: "pointer",
                }}
                onClick={handleUploadClick}
              >
                {uploadedFile ? (
                  <DescriptionIcon style={{ fontSize: 60, opacity: 0.9 }} />
                ) : (
                  <BackupIcon
                    style={{ fontSize: 60, opacity: isDragging ? 0.2 : 0.5 }}
                  />
                )}
                <div style={{ fontSize: 14, opacity: isDragging ? 0.2 : 0.7 }}>
                  {uploadedFileName ||
                    "Drop a CSV/XLSX file here or click Upload"}
                </div>

                <button
                  onClick={handleUploadClick}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "var(--brand-500)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Browse Files
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  onClick={handleUpload}
                  disabled={!uploadedFile}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: uploadedFile
                      ? "#16a34a"
                      : "rgba(22,163,74,0.18)",
                    color: uploadedFile
                      ? "#fff"
                      : isDarkTheme
                      ? "#bdbdbd"
                      : "#7a7a7a",
                    border: "none",
                    cursor: uploadedFile ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2v6"
                      stroke={uploadedFile ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 11l7-7 7 7"
                      stroke={uploadedFile ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke={uploadedFile ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Generate Timetable
                </button>

                <button
                  onClick={triggerDownload}
                  disabled={!lastDownloadUrl}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: lastDownloadUrl
                      ? "rgb(107,75,58)"
                      : "rgba(107,75,58,0.18)",
                    color: lastDownloadUrl
                      ? "#fff"
                      : isDarkTheme
                      ? "#bdbdbd"
                      : "#7a7a7a",
                    border: "none",
                    cursor: lastDownloadUrl ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke={lastDownloadUrl ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 10l5 5 5-5"
                      stroke={lastDownloadUrl ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15V3"
                      stroke={lastDownloadUrl ? "#fff" : "#999"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Timetable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerChatInterface;
