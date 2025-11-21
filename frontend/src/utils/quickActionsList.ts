// Hardcoded list of quick actions for all agents (utility)
export interface QuickAction {
  id: string;
  name: string;
  description: string;
  link: string;
  image: string;
  agent: string; // e.g. 'guidance', 'booking', etc.
  visible?: boolean;
}

export const quickActionsList: QuickAction[] = [
  {
    id: "booking",
    name: "Booking Agent",
    description: "Book lecture halls & facilities",
    link: `${process.env.REACT_APP_URL}/booking-chat`,
    image: "/booking.png",
    agent: "booking",
    visible: true
  },
  {
    id: "planner",
    name: "Planner Agent",
    description: "Plan academic time tables",
    link: `${process.env.REACT_APP_URL}/planner-chat`,
    image: "/planner.png",
    agent: "planner",
    visible: true
  },
  {
    id: "guidance",
    name: "Guidance Agent",
    description: "Get academic guidance",
    link: `${process.env.REACT_APP_URL}/guidance-chat`,
    image: "/attendance.png",
    agent: "guidance",
    visible: true
  },
  {
    id: "gpa",
    name: "GPA Agent (Coming Soon)",
    description: "Calculate and track your GPA (Coming Soon)",
    link: "#",
    image: "/gpa.png",
    agent: "gpa",
    visible: true
  },
  {
    id: "resume",
    name: "Resume Agent (Coming Soon)",
    description: "Build and review your resume (Coming Soon)",
    link: "#",
    image: "/resume.png",
    agent: "resume",
    visible: true
  }
  // Add more actions as needed
];

