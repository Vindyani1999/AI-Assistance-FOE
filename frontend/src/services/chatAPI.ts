import { Auth_Base_URL, Guidance_Base_URL } from "../App";
import {
  ChatMessage,
  ChatResponse,
  ChatSessionsResponse,
} from "../utils/types";

import userRoleUtils from "../utils/userRole";

import { getAccessToken } from "./authAPI";
export async function fetchUserEmailFromProfile(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const response = await fetch(`${Auth_Base_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.email || null;
  } catch (e) {
    return null;
  }
}

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
    // Dispatch a cross-window/custom event so React can listen and react.
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

class ApiService {
  async sendMessage(
    message: string,
    sessionId: string = "default",
    guidanceFilter?: string,
    // When set for non-undergrads: true => only RUH (university docs),
    // false => only UGC (governance docs). If omitted, legacy behaviour (both) applies.
    onlyUseRuh?: boolean
  ): Promise<ChatResponse> {
    const userEmail = await fetchUserEmailFromProfile();
    const postBodyBase: any = {
      message,
      session_id: sessionId,
      user_id: userEmail,
    };
    if (guidanceFilter) {
      postBodyBase.guidance_filter = guidanceFilter;
    }

    try {
      const isUG = userRoleUtils.isUndergraduate(userEmail as any);
      // Undergraduates: single ruh endpoint (existing behaviour)
      if (isUG) {
        const response = await fetch(`${Guidance_Base_URL}/ruh/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(postBodyBase),
        });
        updateAccessTokenFromResponse(response);
        handleAuthError(response);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      }

      // Non-undergrads: behaviour depends on the `onlyUseRuh` flag.
      // - If onlyUseRuh === true  => call only RUH endpoint (university docs)
      // - If onlyUseRuh === false => call only UGC endpoint (governance docs)
      // - If onlyUseRuh === undefined => legacy behaviour: call both and combine
      let ruhPromise: Promise<Response> | null = null;
      let ugcPromise: Promise<Response> | null = null;

      if (onlyUseRuh === undefined) {
        // legacy: call both
        ruhPromise = fetch(`${Guidance_Base_URL}/ruh/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(postBodyBase),
        });

        ugcPromise = fetch(`${Guidance_Base_URL}/ugc/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(postBodyBase),
        });
      } else if (onlyUseRuh === true) {
        ruhPromise = fetch(`${Guidance_Base_URL}/ruh/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(postBodyBase),
        });
      } else {
        // onlyUseRuh === false => only UGC
        ugcPromise = fetch(`${Guidance_Base_URL}/ugc/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify(postBodyBase),
        });
      }

      // run sequentially to ensure auth headers/tokens are refreshed per response if backend rotates tokens
      let ruhRespJson: any = null;
      let ugcRespJson: any = null;

      // Await each promise that was created and build response parts
      if (ruhPromise) {
        try {
          const ruhResp = await ruhPromise;
          updateAccessTokenFromResponse(ruhResp);
          handleAuthError(ruhResp);
          if (ruhResp.ok) ruhRespJson = await ruhResp.json();
          else
            ruhRespJson = {
              response: `RUH request failed: ${ruhResp.status}`,
              conversation_history: [],
              session_id: sessionId,
            };
        } catch (e) {
          ruhRespJson = {
            response: `RUH request error: ${String(e)}`,
            conversation_history: [],
            session_id: sessionId,
          };
        }
      }

      if (ugcPromise) {
        try {
          const ugcResp = await ugcPromise;
          updateAccessTokenFromResponse(ugcResp);
          handleAuthError(ugcResp);
          if (ugcResp.ok) ugcRespJson = await ugcResp.json();
          else
            ugcRespJson = {
              response: `UGC request failed: ${ugcResp.status}`,
              conversation_history: [],
              session_id: sessionId,
            };
        } catch (e) {
          ugcRespJson = {
            response: `UGC request error: ${String(e)}`,
            conversation_history: [],
            session_id: sessionId,
          };
        }
      }

      // Build combined/selected response. If only one side was requested, return that side.
      if (ruhRespJson && !ugcRespJson) {
        return ruhRespJson;
      }
      if (ugcRespJson && !ruhRespJson) {
        return ugcRespJson;
      }
      // both present (legacy) -> combine
      const combinedResponse: ChatResponse = {
        response: `[RUH]\n${
          ruhRespJson?.response || "(no response)"
        }\n\n[UGC]\n${ugcRespJson?.response || "(no response)"}`,
        conversation_history: [
          ...(ruhRespJson?.conversation_history || []),
          ...(ugcRespJson?.conversation_history || []),
        ],
        session_id:
          ruhRespJson?.session_id || ugcRespJson?.session_id || sessionId,
      };
      return combinedResponse;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // // ================= NEW METHOD FOR VOICE =================
  // // Option B: Voice to text using backend endpoint
  // async voiceToText(formData: FormData): Promise<{ transcript: string }> {
  //   try {
  //     const response = await fetch(`${this.baseUrl}/chat/voice`, {
  //       method: "POST",
  //       body: formData, // send as FormData
  //       // Authorization header included if your backend requires auth
  //       headers: {
  //         Authorization: `Bearer ${getAccessToken()}`,
  //       },
  //     });

  //     updateAccessTokenFromResponse(response);
  //     handleAuthError(response);

  //     if (!response.ok) {
  //       throw new Error(`Voice to text request failed with status ${response.status}`);
  //     }

  //     // Backend should return { transcript: "recognized text" }
  //     return await response.json();
  //   } catch (error) {
  //     console.error("voiceToText error:", error);
  //     throw error;
  //   }
  // }

  // Create a new chat session for the user
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating new chat session:", error);
      throw error;
    }
  }

  // Send feedback for a message
  async sendFeedback(
    sessionId: string,
    messageIndex: number,
    feedbackType: "like" | "dislike",
    userId?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${Guidance_Base_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_index: messageIndex,
          feedback_type: feedbackType,
          user_id: userId,
        }),
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      throw error;
    }
  }

  // Clear chat history
  // async clearChat(sessionId: string = 'default', userId?: string): Promise<void> {
  //   try {
  //     const url = new URL(`${this.baseUrl}/chat/${sessionId}`);
  //     if (userId) {
  //       url.searchParams.append('user_id', userId);
  //     }

  //     const response = await fetch(url.toString(), {
  //       method: 'DELETE',
  //       headers: {
  //         Authorization: `Bearer ${getAccessToken()}`,
  //       },
  //     });
  //     updateAccessTokenFromResponse(response);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //   } catch (error) {
  //     console.error('Error clearing chat:', error);
  //     throw error;
  //   }
  // }

  // Get chat history
  async getChatHistory(
    sessionId: string = "default",
    userId?: string
  ): Promise<{ conversation_history: ChatMessage[]; session_id: string }> {
    try {
      const resolvedUser = userId || (await fetchUserEmailFromProfile());
      const url = new URL(`${Guidance_Base_URL}/chat/${sessionId}/history`);
      if (resolvedUser) {
        url.searchParams.append("user_id", resolvedUser);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: string;
    message: string;
    active_sessions: number;
  }> {
    try {
      const response = await fetch(`${Guidance_Base_URL}/health`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error checking health:", error);
      throw error;
    }
  }

  // Get all chat sessions
  async getChatSessions(userId?: string): Promise<ChatSessionsResponse> {
    try {
      const resolvedUser = userId || (await fetchUserEmailFromProfile());
      const url = new URL(`${Guidance_Base_URL}/chat/sessions`);
      if (resolvedUser) {
        url.searchParams.append("user_id", resolvedUser);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      updateAccessTokenFromResponse(response);
      handleAuthError(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error getting chat sessions:", error);
      throw error;
    }
  }

  async routeLatest(
    sessionId: string = "default",
    userId?: string
  ): Promise<ChatResponse> {
    try {
      const resolvedUser = userId || (await fetchUserEmailFromProfile());
      const prefix = userRoleUtils.isUndergraduate(resolvedUser as any)
        ? "ruh"
        : "ugc";
      const url = new URL(`${Guidance_Base_URL}/${prefix}/chat/route`);
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error routing latest message:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
