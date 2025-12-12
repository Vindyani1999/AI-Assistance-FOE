/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, fetchUserEmailFromProfile } from "../../services/chatAPI";
import { ChatMessage, ChatSession } from "../../utils/types";
import "./ChatInterface.css";
import { useTheme } from "../../context/ThemeContext";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import MicIcon from "@mui/icons-material/Mic";
// import IconButton from "@mui/material/IconButton";
import VoiceChatPopupImpl from "./GuidanceVoicePopup";
import { ChatInterfaceProps } from "../../utils/types";
import { SOURCE_OPTIONS, SOURCE_OPTIONS_LECTURER } from "../../utils/CONSTANTS";
import userRoleUtils from "../../utils/userRole";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId = "default",
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const handleNewChat = async () => {
    if (!currentUser) return;
    try {
      const newSession = await apiService.createNewChatSession(
        currentUser.email
      );
      setUserSpecificSessionId(newSession.session_id);
      setMessages([]);
      loadChatSessions();
    } catch (error) {
      console.error("Error creating new chat session:", error);
      setError("Failed to start a new chat.");
    }
  };
  const [inputValue, setInputValue] = useState("");
  const [guidanceFilters, setGuidanceFilters] = useState<string[]>(["all"]);
  const [availableSources, setAvailableSources] = useState(SOURCE_OPTIONS);
  const [useUniversityDocs, setUseUniversityDocs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSpecificSessionId, setUserSpecificSessionId] =
    useState<string>(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [voicePopupVisible, setVoicePopupVisible] = useState(false);
  const pendingVoiceIndexRef = useRef<number | null>(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isUndergrad = userRoleUtils.isUndergraduate(currentUser?.email as any);

  useEffect(() => {
    async function fetchUser() {
      const email = await fetchUserEmailFromProfile();
      if (email) {
        setCurrentUser({ email });
      } else {
        setCurrentUser(null);
      }
    }
    fetchUser();
    setUserSpecificSessionId(sessionId);
  }, [sessionId, navigate]);

  // Configure source chips and default selection based on user role and toggle
  useEffect(() => {
    if (!currentUser) return;
    const email = currentUser?.email as string | undefined;
    const isUG = userRoleUtils.isUndergraduate(email);
    if (isUG) {
      setAvailableSources(SOURCE_OPTIONS);
      setGuidanceFilters(["all"]);
    } else {
      // non-students see the selected set depending on the toggle
      const sources = useUniversityDocs
        ? SOURCE_OPTIONS
        : SOURCE_OPTIONS_LECTURER;
      setAvailableSources(sources);
      // Do not pre-select any chips by default — user must pick chits explicitly
      setGuidanceFilters([]);
    }
  }, [currentUser, useUniversityDocs]);

  const loadChatHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email;
      const history = await apiService.getChatHistory(
        userSpecificSessionId,
        userId
      );
      setMessages(history.conversation_history);
    } catch (error) {
      setError("Failed to load chat history");
    }
  }, [currentUser, userSpecificSessionId]);

  const loadChatSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const userId = currentUser.email;
      const sessionsData = await apiService.getChatSessions(userId);
      setChatSessions(sessionsData.sessions);
    } catch (error) {
      setSessionsError("Failed to load chat sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentUser && userSpecificSessionId) {
      loadChatHistory();
      loadChatSessions();
    }
  }, [userSpecificSessionId, currentUser, loadChatHistory, loadChatSessions]);

  const formatMessage = (content: string): JSX.Element => {
    const paragraphs = content.split("\n\n").filter((p) => p.trim() !== "");
    return (
      <div className="formatted-message">
        {paragraphs.map((paragraph, index) => {
          const numberedListMatch = paragraph.match(
            /^(\d+)\.\s*\*\*(.*?)\*\*:\s*([\s\S]*)/
          );
          if (numberedListMatch) {
            const [, number, title, content] = numberedListMatch;
            return (
              <div key={index} className="message-section">
                <div className="section-header">
                  <span className="section-number">{number}.</span>
                  <span className="section-title">{title}</span>
                </div>
                <div className="section-content">{content.trim()}</div>
              </div>
            );
          }

          const boldHeadingMatch = paragraph.match(
            /^\*\*(.*?)\*\*:\s*([\s\S]*)/
          );
          if (boldHeadingMatch) {
            const [, title, content] = boldHeadingMatch;
            return (
              <div key={index} className="message-section">
                <div className="section-title-only">{title}</div>
                <div className="section-content">{content.trim()}</div>
              </div>
            );
          }

          const formattedText = paragraph
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
            .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic text
            .replace(/`(.*?)`/g, "<code>$1</code>"); // Code text

          return (
            <div
              key={index}
              className="message-paragraph"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          );
        })}
      </div>
    );
  };

  const playAudioFromUrl = (url: string) =>
    new Promise<void>(async (resolve, reject) => {
      try {
        console.debug("playAudioFromUrl: trying to fetch audio URL", url);
        try {
          const resp = await fetch(url, { method: "GET" });
          if (resp.ok) {
            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);
            const audio = new Audio(blobUrl);
            audio.onended = () => {
              URL.revokeObjectURL(blobUrl);
              resolve();
            };
            audio.onerror = (e) => {
              URL.revokeObjectURL(blobUrl);
              reject(e);
            };
            const p = audio.play();
            if (p && typeof p.then === "function") p.catch(reject);
            return;
          } else {
            console.debug(
              "playAudioFromUrl: fetch returned non-ok",
              resp.status
            );
          }
        } catch (fetchErr) {
          console.debug(
            "playAudioFromUrl: fetch failed, will try direct playback",
            fetchErr
          );
        }

        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        const p = audio.play();
        if (p && typeof p.then === "function") p.catch(reject);
      } catch (e) {
        reject(e);
      }
    });

  const playAudioFromBase64 = (base64: string, mime = "audio/mpeg") =>
    new Promise<void>((resolve, reject) => {
      try {
        console.debug("playAudioFromBase64: playing base64 audio, mime=", mime);
        const bstr = atob(base64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (e) => reject(e);
        const p = audio.play();
        if (p && typeof p.then === "function") p.catch(reject);
      } catch (e) {
        reject(e);
      }
    });

  const speakText = (text: string) =>
    new Promise<void>((resolve) => {
      try {
        if (!window.speechSynthesis) return resolve();
        const ut = new SpeechSynthesisUtterance(text);
        ut.onend = () => resolve();
        ut.onerror = () => resolve();
        window.speechSynthesis.speak(ut);
      } catch (e) {
        resolve();
      }
    });

  const playAssistantMedia = async (respOrText: any) => {
    try {
      setIsPlayingAudio(true);
      if (typeof respOrText === "string") {
        console.debug("playAssistantMedia: speaking string");
        await speakText(respOrText);
        return;
      }

      if (respOrText?.audio_url) {
        console.debug(
          "playAssistantMedia: found audio_url",
          respOrText.audio_url
        );
        try {
          await playAudioFromUrl(respOrText.audio_url);
          return;
        } catch (err) {
          console.warn(
            "playAssistantMedia: audio_url playback failed, falling back",
            err
          );
        }
      }
      if (respOrText?.audio_base64) {
        console.debug(
          "playAssistantMedia: found audio_base64 (len)",
          (respOrText.audio_base64 || "").length
        );
        try {
          const mime =
            respOrText.audio_mime || respOrText.audioType || "audio/mpeg";
          await playAudioFromBase64(respOrText.audio_base64, mime);
          return;
        } catch (err) {
          console.warn(
            "playAssistantMedia: audio_base64 playback failed, falling back",
            err
          );
        }
      }

      const t =
        respOrText?.response ||
        respOrText?.assistant_text ||
        respOrText?.text ||
        "";
      if (t) {
        console.debug(
          "playAssistantMedia: falling back to TTS",
          t.slice(0, 80)
        );
        await speakText(t);
      } else {
        console.debug(
          "playAssistantMedia: no audio or text available to speak"
        );
      }
    } catch (e) {
      // swallow playback error
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const sendMessage = async () => {
    if (!currentUser) return;
    if (!inputValue.trim() || isLoading) return;
    // Non-undergraduates must select at least one guidance source (chit)
    if (!isUndergrad && (!guidanceFilters || guidanceFilters.length === 0)) {
      setError("Please select at least one guidance source before sending.");
      return;
    }
    await sendText(inputValue.trim());
  };

  const sendText = async (
    text: string,
    options?: { skipLocal?: boolean; force?: boolean }
  ) => {
    const skipLocal = options?.skipLocal || false;
    const force = options?.force || false;
    if (!text || (!force && isLoading) || !currentUser) return;
    // Enforce chit selection for non-undergraduates unless forced.
    const isUG = userRoleUtils.isUndergraduate(currentUser?.email as any);
    if (!isUG && (!guidanceFilters || guidanceFilters.length === 0) && !force) {
      setError("Please select at least one guidance source before sending.");
      return;
    }
    const userMessage = text;
    setInputValue((prev) => (prev === text ? "" : prev));
    setIsLoading(true);
    setError(null);

    if (!skipLocal) {
      const newUserMessage: ChatMessage = {
        role: "user",
        content: userMessage,
      };
      setMessages((prev) => [...prev, newUserMessage]);
    }

    try {
      let guidanceToSend: string | undefined;
      const isUndergrad = userRoleUtils.isUndergraduate(
        currentUser?.email as any
      );
      if (isUndergrad) {
        guidanceToSend =
          !guidanceFilters ||
          guidanceFilters.length === 0 ||
          guidanceFilters.includes("all")
            ? "all"
            : guidanceFilters.join(",");
      } else {
        // Non-undergrads: if nothing selected, omit guidance_filter so backend
        // receives no restriction. If selections exist, join them.
        guidanceToSend =
          guidanceFilters && guidanceFilters.length > 0
            ? guidanceFilters.join(",")
            : undefined;
      }

      let outgoingMessage = userMessage;
      if (guidanceToSend !== "all") {
        const readable = guidanceFilters
          .map((f) => {
            if (f === "student_handbook") return "Student handbook";
            if (f === "exam_manual") return "Exam manual";
            if (f === "by_law") return "By-law";
            return f;
          })
          .join(", ");
        outgoingMessage = `${userMessage}\n\n[Search only in: ${readable}]`;
      }

      const response = await apiService.sendMessage(
        outgoingMessage,
        userSpecificSessionId,
        guidanceToSend,
        useUniversityDocs
      );
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Only play assistant audio/TTS if the voice popup is currently open
      if (voicePopupVisible) {
        (async () => {
          try {
            await playAssistantMedia(response);
          } catch (e) {
            console.warn("assistant playback error", e);
          }
        })();
      }
      loadChatSessions();
      // Reset selection to sensible default based on role
      if (userRoleUtils.isUndergraduate(currentUser?.email as any)) {
        setGuidanceFilters(["all"]);
      } else {
        setGuidanceFilters([]);
      }
    } catch (error) {
      setError("Failed to send message. Please try again.");
      if (!options?.skipLocal) setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleFilter = (key: string) => {
    if (key === "all") {
      setGuidanceFilters(["all"]);
      return;
    }
    setGuidanceFilters((prev) => {
      const setPrev = new Set(prev.filter((p) => p !== "all"));
      if (setPrev.has(key)) {
        setPrev.delete(key);
      } else {
        setPrev.add(key);
      }
      const arr = Array.from(setPrev);
      // For undergraduates, if nothing is selected fallback to 'all'.
      // For non-undergrads allow an empty selection (no guidance filter sent).
      if (arr.length === 0) {
        if (userRoleUtils.isUndergraduate(currentUser?.email as any))
          return ["all"];
        return [];
      }
      return arr;
    });
  };

  const handleDocsToggle = (useUniv: boolean) => {
    setUseUniversityDocs(useUniv);
    // Do not auto-select chips when toggling document groups.
    // Keep existing chip selection (or lack of selection) so the user explicitly picks chits.
  };

  const handleFeedback = async (
    messageIndex: number,
    feedbackType: "like" | "dislike"
  ) => {
    if (!currentUser) return;
    try {
      const userId = currentUser.email; // Use email as user identifier
      await apiService.sendFeedback(
        userSpecificSessionId,
        messageIndex,
        feedbackType,
        userId
      );
    } catch (error) {
      // console.error('Error sending feedback:', error);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    return;
  };

  // Called when upload starts — insert a pending user bubble
  const handleVoiceSend = () => {
    const placeholder: ChatMessage = {
      role: "user",
      content: "Sending voice...",
    };
    setMessages((prev) => {
      const next = [...prev, placeholder];
      pendingVoiceIndexRef.current = next.length - 1;
      return next;
    });
    // mark upload in progress; do not set assistant loading yet
    setVoiceUploading(true);
  };

  // Called when backend returns full response for voice upload
  const handleVoiceResponse = (resp: any) => {
    // Extract transcript
    let transcript =
      resp?.transcript ||
      resp?.text ||
      resp?.transcription ||
      resp?.result ||
      "";
    if (!transcript && resp?.conversation_history) {
      const ch = resp.conversation_history as any[];
      for (let i = ch.length - 1; i >= 0; i--) {
        if (ch[i]?.role === "user" && ch[i]?.content) {
          transcript = ch[i].content;
          break;
        }
      }
    }

    const assistantText = resp?.response || "";

    // If server already returned an assistant response, apply both user and assistant
    if (assistantText) {
      setMessages((prev) => {
        const next = [...prev];
        const idx = pendingVoiceIndexRef.current;
        if (idx !== null && idx >= 0 && idx < next.length) {
          next[idx] = { role: "user", content: transcript || "(voice)" };
        } else {
          next.push({ role: "user", content: transcript || "(voice)" });
        }
        // Append assistant reply
        next.push({ role: "assistant", content: assistantText });
        return next;
      });
      // Play assistant audio / TTS and show talking.gif while speaking
      // Only play assistant audio/TTS if guidance voice popup is open
      if (voicePopupVisible) {
        (async () => {
          try {
            setIsPlayingAudio(true);
            // try audio_url
            if (resp?.audio_url) {
              const audio = new Audio(resp.audio_url);
              await audio.play();
            } else if (resp?.audio_base64) {
              const bstr = atob(resp.audio_base64);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              const blob = new Blob([u8arr], { type: "audio/mpeg" });
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              await audio.play();
              URL.revokeObjectURL(url);
            } else if (resp?.response || resp?.assistant_text || resp?.text) {
              const t = resp?.response || resp?.assistant_text || resp?.text;
              if (window.speechSynthesis) {
                await new Promise<void>((resolve) => {
                  const ut = new SpeechSynthesisUtterance(t);
                  ut.onend = () => resolve();
                  window.speechSynthesis.speak(ut);
                });
              }
            }
          } catch (e) {
            console.warn("play assistant audio failed", e);
          } finally {
            setIsPlayingAudio(false);
          }
        })();
      }
      // clear pending marker and loading
      pendingVoiceIndexRef.current = null;
      setVoiceUploading(false);
      setIsLoading(false);
      // Refresh sessions metadata
      loadChatSessions();
    } else if (transcript) {
      // No assistant reply yet: replace the pending user bubble with the transcript
      setMessages((prev) => {
        const next = [...prev];
        const idx = pendingVoiceIndexRef.current;
        if (idx !== null && idx >= 0 && idx < next.length) {
          next[idx] = { role: "user", content: transcript };
        } else {
          next.push({ role: "user", content: transcript });
        }
        return next;
      });
      // clear pending marker and mark upload done
      pendingVoiceIndexRef.current = null;
      setVoiceUploading(false);
      // Now route the transcript through the regular sendText flow (skip adding local user msg)
      // Use the new /chat/route endpoint which routes the latest persisted user
      // message (saved by /chat/voice) through the agent without inserting
      // another duplicate user message.
      (async () => {
        try {
          setIsLoading(true);
          const userId = currentUser?.email;
          const resp = await apiService.routeLatest(
            userSpecificSessionId,
            userId
          );
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: resp.response,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          // Speak the assistant response from routed voice
          // Only play routed assistant audio/TTS if guidance voice popup is open
          if (voicePopupVisible) {
            try {
              await playAssistantMedia(resp);
            } catch (e) {
              console.warn("assistant playback error (routed)", e);
            }
          }
          loadChatSessions();
        } catch (e) {
          setError("Failed to route voice message to agent");
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // no transcript and no assistant reply: show error and clean up
      setMessages((prev) =>
        prev.filter((_, i) => i !== pendingVoiceIndexRef.current)
      );
      pendingVoiceIndexRef.current = null;
      setVoiceUploading(false);
      setError("No transcription returned from server");
    }
  };

  return (
    <div
      className={`chat-interface ${
        theme === "dark" ? "dark-theme" : "light-theme"
      }`}
    >
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              Welcome! I'm your Guidance Agent.
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-container">
                {message.role === "assistant" && (
                  <div className="message-avatar">
                    <img
                      src="/openai.png"
                      alt="AI Assistant"
                      className="avatar-image"
                      onError={(e) => {
                        console.error("Failed to load OpenAI image");
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">
                    {message.role === "assistant" ? (
                      formatMessage(message.content)
                    ) : // If this is the pending voice upload bubble, show a small loading spinner there as well
                    index === pendingVoiceIndexRef.current ? (
                      <span className="pending-voice">
                        <span className="pending-spinner" aria-hidden="true">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                        {/* <span style={{ marginLeft: 8 }}>Sending voice...</span> */}
                      </span>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="message-avatar">
                    <img
                      src="/ai_rt.png"
                      alt="User"
                      className="avatar-image"
                      onError={(e) => {
                        console.error("Failed to load AI_RT image");
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              {message.role === "assistant" && (
                <div className="message-actions">
                  <button
                    onClick={() => handleFeedback(index, "like")}
                    className="feedback-btn like-btn"
                    title="Like this response"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleFeedback(index, "dislike")}
                    className="feedback-btn dislike-btn"
                    title="Dislike this response"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H6.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-container">
                <div className="message-avatar">
                  <img
                    src="/openai.png"
                    alt="AI Assistant"
                    className="avatar-image"
                    onError={(e) => {
                      console.error("Failed to load OpenAI image");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="chat-input-container">
          <div className="input-wrapper">
            {/* Guidance source filter - toggle + chips grouped together */}
            <div className="filters-toggle-container">
              {!isUndergrad && (
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${
                      useUniversityDocs ? "active" : ""
                    }`}
                    onClick={() => handleDocsToggle(true)}
                  >
                    University docs
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${
                      !useUniversityDocs ? "active" : ""
                    }`}
                    onClick={() => handleDocsToggle(false)}
                  >
                    Governance docs
                  </button>
                </div>
              )}

              <div
                className="filter-row"
                role="toolbar"
                aria-label="Guidance source filters"
              >
                {availableSources.map((opt) => {
                  const selected = guidanceFilters.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      className={`filter-btn ${selected ? "selected" : ""}`}
                      onClick={() => toggleFilter(opt.key)}
                      aria-pressed={selected}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              rows={3}
              disabled={isLoading}
            />
            <div className="input-buttons">
              <button
                onClick={sendMessage}
                disabled={
                  isLoading ||
                  !inputValue.trim() ||
                  (!isUndergrad &&
                    (!guidanceFilters || guidanceFilters.length === 0))
                }
                className="input-btn send-btn"
                title="Send message"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
              </button>

              <button
                onClick={() => {
                  // Prevent opening voice popup if non-undergrad and no chips selected
                  if (
                    !isUndergrad &&
                    (!guidanceFilters || guidanceFilters.length === 0)
                  ) {
                    setError(
                      "Please select at least one guidance source before using voice input."
                    );
                    return;
                  }
                  setVoicePopupVisible(true);
                }}
                disabled={
                  isLoading ||
                  !currentUser ||
                  (!isUndergrad &&
                    (!guidanceFilters || guidanceFilters.length === 0))
                }
                className="input-btn mic-btn"
                title="Voice input"
                aria-label="Open voice input"
                type="button"
              >
                <MicIcon />
              </button>

              <button
                onClick={handleNewChat}
                className="input-btn new-chat-btn"
                title="Start a new chat"
                type="button"
              >
                <LibraryAddIcon />
              </button>
            </div>
          </div>
        </div>
        <VoiceChatPopupImpl
          open={voicePopupVisible}
          sessionId={userSpecificSessionId}
          userEmail={currentUser?.email}
          onClose={() => {
            setVoicePopupVisible(false);
            if (currentUser && userSpecificSessionId) loadChatHistory();
          }}
        />
      </div>

      <div className="sidebar">
        <div className="chat-history-section">
          <h3>Chat History</h3>
          <div className="chat-history-list">
            {sessionsLoading ? (
              <div className="chat-history-loading">
                Loading chat history...
              </div>
            ) : sessionsError ? (
              <div className="chat-history-error">
                {sessionsError}
                <button onClick={loadChatSessions} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="chat-history-empty">
                No chat history yet. Start a conversation!
              </div>
            ) : (
              [...chatSessions].map((session) => (
                <div
                  key={session.session_id}
                  className={`chat-history-item ${
                    session.session_id === userSpecificSessionId ? "active" : ""
                  }`}
                  onClick={() => {
                    if (session.session_id !== userSpecificSessionId) {
                      setUserSpecificSessionId(session.session_id);
                      setMessages([]);
                    }
                  }}
                >
                  <div className="chat-title">
                    {session.topic.split(" ").slice(0, 4).join(" ")}
                    {session.topic.split(" ").length > 4 ? "..." : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
