import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useNotification } from "../../context/NotificationContext";
import { uploadVoice } from "../../services/voiceAPI";
import MicIcon from "@mui/icons-material/Mic";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { VoiceRecorderProps } from "../../utils/types";

const VoiceRecorder = forwardRef<any, VoiceRecorderProps>(
  function VoiceRecorder(
    {
      sessionId,
      userEmail,
      onTranscription,
      onVoiceSend,
      onVoiceResponse,
      showControls = true,
      showTimer = true,
      showUploading = true,
      onRecordingChange,
    },
    ref
  ) {
    const [isRecording, setIsRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Removed local preview/download state: we don't keep blobs locally
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { notify } = useNotification();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const start = async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;
        chunksRef.current = [];
        const options: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported("audio/webm"))
          options.mimeType = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/ogg"))
          options.mimeType = "audio/ogg";
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        // onstop will either upload the blob or be ignored if cancel() was called
        recorder.onstop = async () => {
          // stop tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          const ignore = ignoreOnStopRef.current;
          const blob = new Blob(chunksRef.current, {
            type: chunksRef.current[0]?.type || "audio/webm",
          });
          if (ignore) {
            // clear chunks and reset flag
            chunksRef.current = [];
            ignoreOnStopRef.current = false;
            return;
          }
          // upload automatically
          await uploadBlob(blob);
        };

        recorder.start();
        setIsRecording(true);
        onRecordingChange?.(true);
        // start timer
        setRecordSeconds(0);
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000) as unknown as number;
      } catch (err: any) {
        console.error("VoiceRecorder start error", err);
        const msg = err?.message || "Microphone access denied or not available";
        setError(msg);
        try {
          notify("error", "Microphone Permission", msg, 7000);
        } catch (e) {
          console.warn("notify failed", e);
        }
      }
    };

    const stop = () => {
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn("stop error", err);
      } finally {
        setIsRecording(false);
        onRecordingChange?.(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    const cancel = () => {
      try {
        // mark that onstop should not trigger upload
        ignoreOnStopRef.current = true;
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn("cancel error", err);
      } finally {
        // ensure tracks stopped
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        chunksRef.current = [];
        setIsRecording(false);
        onRecordingChange?.(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // reset flag just in case
        ignoreOnStopRef.current = false;
      }
    };

    const uploadBlob = async (blob: Blob) => {
      if (!blob) return;
      setUploading(true);
      setError(null);
      try {
        onVoiceSend?.();
        const resp = await uploadVoice({
          blob,
          sessionId,
          userId: userEmail || "",
          onProgress: (pct) => {
            // optional: could set progress state here
            // console.debug('upload progress', pct);
          },
        });

        const normalized = resp || {};
        onVoiceResponse?.(normalized);
        if (normalized.transcript) {
          onTranscription?.(normalized.transcript);
        }
      } catch (err) {
        console.error("Voice upload failed", err);
        const msg =
          (err as any)?.message ||
          "Failed to upload audio or transcribe. Try again.";
        setError(msg);
        try {
          notify("error", "Upload Failed", msg, 7000);
        } catch (e) {
          console.warn("notify failed", e);
        }
      } finally {
        setUploading(false);
        chunksRef.current = [];
        setRecordSeconds(0);
      }
    };

    // No local preview or object URLs: we avoid storing audio locally
    // internal flag to let cancel() skip upload in onstop
    const ignoreOnStopRef = useRef<boolean>(false);

    useImperativeHandle(ref, () => ({
      start: () => start(),
      stop: () => stop(),
      cancel: () => cancel(),
      isRecording: () => isRecording,
    }));

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showControls && (
          <IconButton
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            onClick={isRecording ? stop : start}
            title={isRecording ? "Stop recording" : "Record voice"}
            style={{ color: isRecording ? "#c62828" : undefined }}
          >
            {isRecording ? <CloseIcon /> : <MicIcon />}
          </IconButton>
        )}

        {isRecording && showTimer && (
          <div
            style={{ fontSize: 12, color: "#c62828", minWidth: 48 }}
          >{`${Math.floor(recordSeconds / 60)
            .toString()
            .padStart(1, "0")}:${(recordSeconds % 60)
            .toString()
            .padStart(2, "0")}`}</div>
        )}

        {uploading && showUploading && (
          <div style={{ fontSize: 12 }}>Uploading...</div>
        )}
        {error && <div style={{ color: "red", fontSize: 12 }}>{error}</div>}

        {/* No local preview/download UI for privacy and to avoid local storage */}
      </div>
    );
  }
);

export default VoiceRecorder;
