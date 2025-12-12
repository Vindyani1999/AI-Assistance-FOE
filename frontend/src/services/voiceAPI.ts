import userRoleUtils from "../utils/userRole";
import { UploadVoiceOptions } from "../utils/types";
import { Guidance_Base_URL } from "../App";

const isUndergraduate = (userId?: string | null) =>
  userRoleUtils.isUndergraduate(userId as any);

export async function uploadVoice(opts: UploadVoiceOptions) {
  const { blob, sessionId, userId, onProgress } = opts;

  const endpoint = isUndergraduate(userId)
    ? "/ruh/chat/voice"
    : "/ugc/chat/voice";
  const url = `${Guidance_Base_URL}${endpoint}`;

  const form = new FormData();
  const ext = blob.type.includes("ogg")
    ? "ogg"
    : blob.type.includes("mpeg")
    ? "mp3"
    : blob.type.includes("wav")
    ? "wav"
    : "webm";
  const filename = `voice.${ext}`;
  form.append("file", blob, filename);
  form.append("session_id", sessionId);
  form.append("user_id", userId || "");

  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          resolve(json);
        } catch (e) {
          resolve({ text: xhr.responseText });
        }
      } else {
        reject(
          new Error(
            `Upload failed: ${xhr.status} ${xhr.statusText}: ${xhr.responseText}`
          )
        );
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          try {
            onProgress(pct);
          } catch (e) {
            // ignore progress handler errors
          }
        }
      };
    }

    xhr.send(form);
  });
}

export default uploadVoice;
