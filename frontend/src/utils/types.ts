export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_history: ChatMessage[];
  session_id: string;
}

export interface FeedbackRequest {
  session_id: string;
  message_index: number;
  feedback_type: "like" | "dislike";
  user_id?: string;
}

export interface ChatSession {
  session_id: string;
  topic: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total_count: number;
}

export type UploadVoiceOptions = {
  blob: Blob;
  sessionId: string;
  userId?: string | null;
  backendBase?: string;
  onProgress?: (percent: number) => void;
};

export interface ChatInterfaceProps {
  sessionId?: string;
}

export interface AuthFormValues {
  emailFront: string;
  emailDomain: string;
  password: string;
  confirmPassword: string;
  title: string;
  department: string;
  firstName: string;
  lastName: string;
}

export interface LoginFormValues {
  emailFront: string;
  emailDomain: string;
  password: string;
}
export interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: { email: string; password: string }) => void;
  buttonText?: string;
  theme?: "light" | "dark" | string;
  onSwitchToLogin?: () => void;
}

export interface AuthPageProps {
  onAuthSuccess: (userSession: any) => void;
  theme?: "light" | "dark" | string;
}

export interface OTPPopupProps {
  open: boolean;
  email: string;
  timer: number;
  otp: string;
  error?: string;
  onChange: (otp: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onResend?: () => void;
}

export interface Message {
  role: "user" | "assistant";
  content: string | JSX.Element;
  recommendations?: Recommendation[];
  showRecommendations?: boolean;
}

export interface Recommendation {
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

export interface CalendarProps {
  refreshKey?: any;
  onCellClick?: (cell: any) => void;
}

export type SwapRequest = {
  id: number;
  from: string;
  to: string;
  message: string;
  isSender: boolean;
};

export interface MessageChatUI {
  role: "user" | "assistant";
  content: string | JSX.Element;
  recommendations?: any[];
  showRecommendations?: boolean;
}

export interface ChatUIProps {
  messages: MessageChatUI[];
  inputValue: string;
  setInputValue: (val: string) => void;
  isLoading: boolean;
  error: string;
  onSend: () => void;
  onClear: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  formatMessage?: (text: string) => string;
  agentName?: string; // Optional prop for agent name
  onAppendMessages?: (
    msgs: { role: "user" | "assistant"; content: string }[]
  ) => void; // optional handler to append messages from popup
}

export type GuidanceVoiceProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  userEmail?: string | null;
};

export interface VoiceRecorderProps {
  sessionId: string;
  userEmail?: string | null;
  onTranscription?: (text: string) => void;
  onVoiceSend?: () => void; // called when upload starts
  onVoiceResponse?: (resp: any) => void; // full backend response for voice
  showControls?: boolean;
  showTimer?: boolean;
  showUploading?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export interface HomePageProps {
  onAuthSuccess: () => void;
}

export interface QuickAccessCardProps {
  agents?: { id: string; name?: string }[];
}

export interface LandingPageProps {
  userProfile?: any;
  agents?: any[];
  onLogout?: () => void;
}

export type UsageMap = { [date: string]: boolean };

export interface UserProfileProps {
  userProfile: any;
}

export interface MainLayoutProps {
  userProfile?: any;
  agents?: any[];
  onLogout?: () => void;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
  role: string;
  department: string;
}

export interface VerifyOtpResponse {
  message: string;
  role?: string;
  name?: string;
  department?: string;
}

export interface QuickAction {
  id: string;
  name: string;
  description: string;
  link: string;
  image: string;
  agent: string; // e.g. 'guidance', 'booking', etc.
  visible?: boolean;
}
