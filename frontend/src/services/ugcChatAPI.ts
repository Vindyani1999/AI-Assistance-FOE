import { Guidance_Base_URL } from "../App";
import { ChatResponse } from "../utils/types";
import { getAccessToken } from "./authAPI";
import { fetchUserEmailFromProfile } from "./chatAPI";

function updateAccessTokenFromResponse(response: Response) {
  const newToken = response.headers.get("x-access-token");
  if (newToken) {
    localStorage.setItem("auth_token", newToken);
  }
}

function handleAuthError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    try {
      localStorage.removeItem("auth_token");
    } catch (e) {
      // ignore
    }
    try {
      const ev = new CustomEvent("auth:logout", {
        detail: { status: response.status },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("auth:logout", true, true, {
        status: response.status,
      });
      window.dispatchEvent(event);
    }
  }
}

class UgcApiService {
  // Send a message to the UGC chat endpoint
  async sendMessage(
    message: string,
    sessionId: string = "default",
    guidanceFilter?: string
  ): Promise<ChatResponse> {
    const userEmail = await fetchUserEmailFromProfile();
    const postBody: any = {
      message,
      session_id: sessionId,
      user_id: userEmail,
    };
    if (guidanceFilter) postBody.guidance_filter = guidanceFilter;

    try {
      const prefix = "ugc"; // fixed for this service
      // debug payload
      console.debug("ugc.sendMessage payload", { prefix, postBody });

      const response = await fetch(`${Guidance_Base_URL}/${prefix}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(postBody),
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("UGC sendMessage error:", error);
      throw error;
    }
  }

  // Route the latest saved message through the UGC agent
  async routeLatest(sessionId: string = "default", userId?: string) {
    try {
      const resolvedUser = userId || (await fetchUserEmailFromProfile());
      const url = new URL(`${Guidance_Base_URL}/ugc/chat/route`);
      if (sessionId) url.searchParams.append("session_id", sessionId);
      if (resolvedUser) url.searchParams.append("user_id", resolvedUser);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("UGC routeLatest error:", error);
      throw error;
    }
  }

  // Create a new chat session (uses shared /chat/session endpoint)
  async createNewChatSession(
    userId?: string
  ): Promise<{ session_id: string; topic?: string }> {
    try {
      const resolvedUser = userId || (await fetchUserEmailFromProfile());
      const response = await fetch(`${Guidance_Base_URL}/chat/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ user_id: resolvedUser }),
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("UGC createNewChatSession error:", error);
      throw error;
    }
  }

  // Optional: voice to text helper for UGC voice endpoint (if implemented)
  // async voiceToText(formData: FormData): Promise<{ transcript: string }> {
  //   try {
  //     const response = await fetch(`${Guidance_Base_URL}/ugc/chat/voice`, {
  //       method: "POST",
  //       body: formData,
  //       headers: { Authorization: `Bearer ${getAccessToken()}` },
  //     });
  //     updateAccessTokenFromResponse(response);
  //     handleAuthError(response);
  //     if (!response.ok) throw new Error(`Voice to text failed: ${response.status}`);
  //     return await response.json();
  //   } catch (e) {
  //     console.error("UGC voiceToText error", e);
  //     throw e;
  //   }
  // }
}

export const ugcApiService = new UgcApiService();
