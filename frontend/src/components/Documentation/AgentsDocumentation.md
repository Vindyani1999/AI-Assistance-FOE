# AI-Assistance-FOE Agents Documentation

## Overview
This documentation provides a comprehensive overview of the three main agents in the AI-Assistance-FOE system: Guidance Agent, Booking Agent, and Planner Agent. Each agent is designed to address specific user needs within the educational and administrative environment.

---

## 1. Guidance Agent

### Purpose
The Guidance Agent assists students and staff by providing information, answering queries, and offering guidance related to academic and campus life.

### Features
- Natural language chat interface
- FAQ and document retrieval
- Personalized recommendations
- Integration with student handbook and exam manual

### Architecture
- Frontend: React components (e.g., `GuidanceAgent/ChatInterface`)
- Backend: FastAPI (Python) for NLP and document search
- Data: Documents stored in `backend/data/documents/`

### Usage
- Access via the web portal
- Enter queries in the chat interface
- Receives instant responses and document links

### API Endpoints (Example)
- `/api/guidance/query` – Submit a question
- `/api/guidance/docs` – Retrieve documents

---

## 2. Booking Agent (Room Booking Assistant)

### Purpose
The Booking Agent streamlines the process of booking rooms and resources for students, faculty, and staff.

### Features
- Room availability checking
- Booking requests and confirmations
- Conflict resolution and scheduling
- Integration with campus calendar

### Architecture
- Frontend: Booking forms and calendar views
- Backend: FastAPI (Python) in `backend-HBA/src/`
- Data: Room schedules in database

### Usage
- Select desired room and time slot
- Submit booking request
- Receive confirmation or alternative suggestions

### API Endpoints (Example)
- `/api/booking/check` – Check room availability
- `/api/booking/book` – Book a room
- `/api/booking/cancel` – Cancel a booking

---

## 3. Planner Agent

### Purpose
The Planner Agent helps users organize tasks, schedules, and deadlines, enhancing productivity and time management.

### Features
- Task creation and tracking
- Calendar integration
- Automated reminders
- Progress analytics

### Architecture
- Frontend: Task management UI
- Backend: FastAPI (Python) or Node.js
- Data: User tasks and schedules

### Usage
- Add tasks and deadlines
- View calendar and progress
- Receive reminders and analytics

### API Endpoints (Example)
- `/api/planner/tasks` – Manage tasks
- `/api/planner/calendar` – View calendar
- `/api/planner/reminders` – Set reminders

---

## Contact & Support
For further assistance, contact the development team or refer to the README for setup instructions.
