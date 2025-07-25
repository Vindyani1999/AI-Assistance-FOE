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
    link: "https://localhost:3000/booking-chat",
    image: "/booking.png",
    agent: "booking",
    visible: true
  },
  {
    id: "planner",
    name: "Planner Agent",
    description: "Plan academic time tables",
    link: "http://localhost:3000/planner-chat",
    image: "/planner.png",
    agent: "planner",
    visible: true
  },
  {
    id: "guidance",
    name: "Guidance Agent",
    description: "Get academic guidance",
    link: "https://localhost:3000/guidance-chat",
    image: "/attendance.png",
    agent: "guidance",
    visible: true
  }
  // Add more actions as needed
];

