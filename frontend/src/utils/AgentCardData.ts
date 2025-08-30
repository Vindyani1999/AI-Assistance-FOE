export interface AgentCard {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  url: string;
}

export const agentCardData: AgentCard[] = [
  {
    id: 'guidance',
    name: 'Guidance Agent',
    title: 'Academic Assistant 🎓',
    description: 'The faculty assistant for guide and support you',
    image: '/ga_new.png',
    url: '/guidance-chat'
  },
  {
    id: 'booking',
    name: 'Booking Agent',
    title: 'Facility Booking 🏢',
    description: 'Book lecture halls, meeting rooms, and campus facilities with ease',
    image: '/hba_new.png',
    url: '/booking-chat'
  },
  {
    id: 'planner',
    name: 'Planner Agent',
    title: 'Schedule Planner 📅',
    description: 'Plan and organize your academic timetables and schedules efficiently',
    image: '/pa_new.png',
    url: '/planner-chat'
  }
];
