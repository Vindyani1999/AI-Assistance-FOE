// utils/session.ts
export function getSessionId() {
  let sessionId = localStorage.getItem('chatbot_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID(); // or uuidv4()
    localStorage.setItem('chatbot_session_id', sessionId);
  }
  return sessionId;
}
