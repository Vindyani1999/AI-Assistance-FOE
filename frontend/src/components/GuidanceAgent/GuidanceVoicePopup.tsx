import React, { useEffect, useRef, useState } from "react";
import VoiceRecorder from "./VoiceRecorder";
import "./GuidanceVoicePopup.css";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SyncIcon from "@mui/icons-material/Sync";
import { useNotification } from "../../context/NotificationContext";
import { GuidanceVoiceProps } from "../../utils/types";

// Popup is voice-only; no message type required here

export default function VoiceChatPopupImpl({
  open,
  onClose,
  sessionId,
  userEmail,
}: GuidanceVoiceProps) {
  const recorderRef = useRef<any>(null);
  const [state, setState] = useState<
    "idle" | "recording" | "thinking" | "speaking"
  >("idle");
  // messages list intentionally removed for voice-only popup
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const { notify } = useNotification();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [firstInteraction, setFirstInteraction] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      // when the popup opens, treat it as the first interaction until user sends
      setFirstInteraction(true);
      const t = setTimeout(() => {
        try {
          recorderRef.current?.start();
          setState("recording");
        } catch (e) {
          console.warn("Failed to start recorder on open", e);
          const errMsg =
            (e && (e as any).name === "NotAllowedError") ||
            (e &&
              typeof (e as any).message === "string" &&
              (e as any).message.toLowerCase().includes("permission"))
              ? "Microphone access was denied. Please enable microphone permissions in your browser settings."
              : "Unable to access microphone.";
          setError(errMsg);
          try {
            notify("error", "Microphone Permission", errMsg, 8000);
          } catch (notifyErr) {
            console.warn("Notification failed", notifyErr);
          }
        }
      }, 200);
      return () => clearTimeout(t);
    } else {
      try {
        recorderRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setState("idle");
      setTranscript(null);
      setError(null);
    }
  }, [open, notify]);

  // Timer for recording duration: starts when state becomes 'recording'
  useEffect(() => {
    let id: any = null;
    if (state === "recording") {
      setElapsedSecs(0);
      id = setInterval(() => {
        setElapsedSecs((s) => s + 1);
      }, 1000);
    } else {
      // stop timer when leaving recording
      if (id) clearInterval(id);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [state]);

  // speaking state does not show a timer; playback controls are simple pause/stop
  useEffect(() => {
    if (state !== "speaking") setIsPaused(false);
  }, [state]);

  function handlePauseResume() {
    try {
      if (isPaused) {
        // resume
        if (currentAudioRef.current) {
          currentAudioRef.current.play().catch(() => {});
        } else if (window.speechSynthesis && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        setIsPaused(false);
      } else {
        // pause
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
        }
        setIsPaused(true);
      }
    } catch (e) {
      console.warn("pause/resume failed", e);
    }
  }

  async function handleStopPlayback() {
    try {
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
        } catch (_) {}
        try {
          if (
            currentAudioUrlRef.current &&
            currentAudioUrlRef.current.startsWith("blob:")
          ) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
          }
        } catch (_) {}
        currentAudioRef.current = null;
        currentAudioUrlRef.current = null;
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    } catch (e) {
      console.warn("stop playback failed", e);
    } finally {
      setState("idle");
      setIsPaused(false);
      await restartRecordingIfOpen();
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(1, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleVoiceSend() {
    setUploading(true);
    setFirstInteraction(false);
    setState("thinking");
  }

  function handleTranscription(text: string) {
    setTranscript(text);
  }

  async function restartRecordingIfOpen() {
    if (!open) return;
    try {
      // attempt to start the recorder again
      await recorderRef.current?.start?.();
      setState("recording");
    } catch (e) {
      console.warn("Failed to restart recorder after playback", e);
      const msg =
        (e && (e as any).name === "NotAllowedError") ||
        (e &&
          typeof (e as any).message === "string" &&
          (e as any).message.toLowerCase().includes("permission"))
          ? "Microphone access was denied. Please enable microphone permissions in your browser settings."
          : "Unable to access microphone to restart recording.";
      setError(msg);
      try {
        notify("error", "Microphone", msg, 6000);
      } catch (_) {
        /* ignore */
      }
      setState("idle");
    }
  }

  function getTopChip() {
    if (uploading) return "Uploading...";
    if (state === "speaking") return "System is talking...";
    if (state === "thinking") return "Processing...";
    if (state === "recording") return "Your next question...";
    if (open && firstInteraction) return "What is your question?";
    if (transcript) {
      const preview =
        transcript.length > 28 ? transcript.slice(0, 28) + "..." : transcript;
      return `Ask a follow-up about: "${preview}"`;
    }
    return "You can ask anything";
  }

  async function playAssistantAudio(resp: any) {
    try {
      console.debug(
        "playAssistantAudio: response keys",
        Object.keys(resp || {})
      );
      if (resp?.audio_url) {
        try {
          const r = await fetch(resp.audio_url, { method: "GET" });
          if (r.ok) {
            const blob = await r.blob();
            const blobUrl = URL.createObjectURL(blob);
            // remember URL so we can revoke later
            currentAudioUrlRef.current = blobUrl;
            // stop any existing audio
            if (currentAudioRef.current) {
              try {
                currentAudioRef.current.pause();
              } catch (_) {}
              currentAudioRef.current = null;
            }
            const audio = new Audio(blobUrl);
            currentAudioRef.current = audio;
            setState("speaking");
            audio.onended = async () => {
              try {
                if (
                  currentAudioUrlRef.current &&
                  currentAudioUrlRef.current.startsWith("blob:")
                ) {
                  URL.revokeObjectURL(currentAudioUrlRef.current);
                }
              } catch (_) {}
              currentAudioRef.current = null;
              currentAudioUrlRef.current = null;
              await restartRecordingIfOpen();
            };
            audio.onerror = async (e) => {
              try {
                if (
                  currentAudioUrlRef.current &&
                  currentAudioUrlRef.current.startsWith("blob:")
                ) {
                  URL.revokeObjectURL(currentAudioUrlRef.current);
                }
              } catch (_) {}
              currentAudioRef.current = null;
              currentAudioUrlRef.current = null;
              console.warn("playAssistantAudio: audio playback error", e);
              await restartRecordingIfOpen();
            };
            try {
              await audio.play();
            } catch (playErr) {
              console.warn(
                "playAssistantAudio: audio.play() rejected",
                playErr
              );
              // ensure state resets if play failed
              try {
                if (
                  currentAudioUrlRef.current &&
                  currentAudioUrlRef.current.startsWith("blob:")
                ) {
                  try {
                    URL.revokeObjectURL(currentAudioUrlRef.current);
                  } catch (_) {}
                }
              } catch (_) {}
              currentAudioRef.current = null;
              currentAudioUrlRef.current = null;
              setState("idle");
            }
            return;
          }
        } catch (err) {
          try {
            if (currentAudioRef.current) {
              try {
                currentAudioRef.current.pause();
              } catch (_) {}
              currentAudioRef.current = null;
            }
            const audio = new Audio(resp.audio_url);
            audio.crossOrigin = "anonymous";
            currentAudioRef.current = audio;
            currentAudioUrlRef.current = resp.audio_url;
            setState("speaking");
            audio.onended = async () => {
              currentAudioRef.current = null;
              currentAudioUrlRef.current = null;
              await restartRecordingIfOpen();
            };
            audio.onerror = async (e) => {
              currentAudioRef.current = null;
              currentAudioUrlRef.current = null;
              console.warn(
                "playAssistantAudio: direct audio_url playback failed",
                e
              );
              await restartRecordingIfOpen();
            };
            try {
              await audio.play();
            } catch (playErr) {
              console.warn(
                "playAssistantAudio: direct audio.play() rejected",
                playErr
              );
              currentAudioRef.current = null;
              setState("idle");
            }
            return;
          } catch (e) {
            console.warn(
              "playAssistantAudio: direct audio_url playback failed",
              e
            );
          }
        }
      }

      if (resp?.audio_base64) {
        try {
          const bstr = atob(resp.audio_base64);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const blob = new Blob([u8arr], {
            type: resp.audio_mime || "audio/mpeg",
          });
          const url = URL.createObjectURL(blob);
          currentAudioUrlRef.current = url;
          if (currentAudioRef.current) {
            try {
              currentAudioRef.current.pause();
            } catch (_) {}
            currentAudioRef.current = null;
          }
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          setState("speaking");
          audio.onended = async () => {
            try {
              if (
                currentAudioUrlRef.current &&
                currentAudioUrlRef.current.startsWith("blob:")
              ) {
                URL.revokeObjectURL(currentAudioUrlRef.current);
              }
            } catch (_) {}
            currentAudioRef.current = null;
            currentAudioUrlRef.current = null;
            await restartRecordingIfOpen();
          };
          audio.onerror = async (e) => {
            try {
              if (
                currentAudioUrlRef.current &&
                currentAudioUrlRef.current.startsWith("blob:")
              ) {
                URL.revokeObjectURL(currentAudioUrlRef.current);
              }
            } catch (_) {}
            currentAudioRef.current = null;
            currentAudioUrlRef.current = null;
            console.warn("playAssistantAudio: base64 audio playback failed", e);
            await restartRecordingIfOpen();
          };
          try {
            await audio.play();
          } catch (playErr) {
            console.warn(
              "playAssistantAudio: base64 audio.play() rejected",
              playErr
            );
            try {
              if (
                currentAudioUrlRef.current &&
                currentAudioUrlRef.current.startsWith("blob:")
              ) {
                URL.revokeObjectURL(currentAudioUrlRef.current);
              }
            } catch (_) {}
            currentAudioRef.current = null;
            currentAudioUrlRef.current = null;
            setState("idle");
          }
          return;
        } catch (e) {
          console.warn("playAssistantAudio: base64 playback failed", e);
        }
      }

      const text =
        resp?.assistant_text ||
        resp?.text ||
        resp?.response ||
        resp?.reply ||
        resp?.answer;
      if (text && window.speechSynthesis) {
        // stop any currently playing audio
        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause();
          } catch (_) {}
          currentAudioRef.current = null;
        }
        const ut = new SpeechSynthesisUtterance(text);
        setState("speaking");
        ut.onend = async () => {
          await restartRecordingIfOpen();
        };
        ut.onerror = async () => {
          await restartRecordingIfOpen();
        };
        window.speechSynthesis.speak(ut);
        return;
      }
    } catch (e) {
      console.warn("playAssistantAudio error", e);
    }
    setState("idle");
  }

  async function handleVoiceResponse(resp: any) {
    try {
      // We intentionally do not append assistant messages to the popup message list
      // because voice playback is the primary communication channel in this popup.
      // Backend response text will still be voiced via playAssistantAudio.
      await playAssistantAudio(resp || {});
      setUploading(false);
    } catch (e) {
      console.error("handleVoiceResponse error", e);
      // If playback failed, ensure we leave the popup in idle so the user can retry
      if (open) setState("idle");
      setUploading(false);
    }
  }

  function onClickListening() {
    try {
      recorderRef.current?.stop();
    } catch (e) {
      console.warn("stop failed", e);
    }
  }

  function handleCloseClick() {
    // Always attempt to release the microphone/recorder when closing the popup.
    // This calls the recorder's `cancel()` which stops tracks and prevents upload.
    try {
      recorderRef.current?.cancel?.();
      setState("idle");
      setUploading(false);
    } catch (e) {
      console.warn("cancel on close failed", e);
    }

    // If speaking, stop playback immediately (also cancel any speechSynthesis)
    try {
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
        } catch (_) {}
        try {
          if (
            currentAudioUrlRef.current &&
            currentAudioUrlRef.current.startsWith("blob:")
          ) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
          }
        } catch (_) {}
        currentAudioRef.current = null;
        currentAudioUrlRef.current = null;
        setState("idle");
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    } catch (e) {
      console.warn("stop audio on close failed", e);
    }

    onClose();
    // Do NOT refresh the page on close. We just release microphone and
    // stop any playback/speech so the app continues without a full reload.
  }

  return open ? (
    <div className="gvp-root">
      <div className="gvp-overlay" onClick={handleCloseClick} />
      <div className="gvp-card">
        <div className="gvp-header">
          <strong></strong>
          <IconButton
            onClick={handleCloseClick}
            aria-label="Close"
            className="gvp-close"
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* base talking gif will be shown inside the visual area; badges overlay below */}

        <div className="gvp-body">
          <VoiceRecorder
            ref={recorderRef}
            sessionId={sessionId}
            userEmail={userEmail}
            showControls={false}
            showTimer={false}
            showUploading={false}
            onVoiceSend={handleVoiceSend}
            onVoiceResponse={handleVoiceResponse}
            onTranscription={handleTranscription}
          />

          <div className="gvp-visual">
            <div className="gvp-gif-container">
              <img
                src="/talking.gif"
                alt="Assistant"
                className="gvp-gif-base"
              />

              <div className="gvp-top-chip" role="status">
                {getTopChip()}
              </div>

              <div className="gvp-center-icon">
                {state === "recording" && (
                  <MicIcon
                    className="gvp-center-svg"
                    onClick={onClickListening}
                  />
                )}
                {state === "thinking" && (
                  <SyncIcon className="gvp-center-svg" />
                )}
                {state === "speaking" && (
                  <VolumeUpIcon className="gvp-center-svg" />
                )}
              </div>
              {/* timer overlay (shows while recording) */}
              {state === "recording" && (
                <div className="gvp-timer" role="status">
                  <span className="gvp-timer-text">
                    {formatTime(elapsedSecs)}
                  </span>
                  <button
                    className="gvp-send-btn"
                    onClick={() => {
                      try {
                        recorderRef.current?.stop();
                      } catch (e) {
                        console.warn("send click stop failed", e);
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
              {/* playback controls positioned absolutely over the gif */}
              {state === "speaking" && (
                <div className="gvp-playback-controls">
                  <button
                    className="gvp-play-btn"
                    onClick={handlePauseResume}
                    aria-label={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  </button>
                  <button
                    className="gvp-stop-btn"
                    onClick={handleStopPlayback}
                    aria-label="Stop"
                  >
                    <StopIcon />
                  </button>
                </div>
              )}
            </div>
          </div>

          {transcript && (
            <div className="gvp-transcript">
              <div className="gvp-transcript-label">You said</div>
              <div className="gvp-transcript-text">{transcript}</div>
            </div>
          )}

          {/* messages list removed from popup — voice-only UI */}

          {error && <div className="gvp-error">{error}</div>}
        </div>
      </div>
    </div>
  ) : null;
}
