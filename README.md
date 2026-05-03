# ⚖️ GrievancePortal — MERN Citizen Grievance Management System

A full-stack MERN application for submitting and resolving citizen complaints with role-based workflows.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Seed the Database (run once)
```bash
cd server
npm run seed
```
This creates 8 departments, 1 admin, and 1 manager per department.

### 2. Start the Backend
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

### 3. Start the Frontend
```bash
cd client
npm start
# Opens http://localhost:3000
```

---

## 👤 Demo Credentials

| Role    | Email                                    | Password    |
|---------|------------------------------------------|-------------|
| Admin   | admin@grievance.com                      | admin123    |
| Manager | manager.public.works@grievance.com       | manager123  |
| Manager | manager.water.&.sanitation@grievance.com | manager123  |
| User    | Register via /register                   | your choice |

---

## 📁 Project Structure

```
ead project/
├── server/
│   ├── models/
│   │   ├── User.js         # User schema (user/manager/admin roles)
│   │   ├── Department.js   # Department schema
│   │   └── Complaint.js    # Complaint schema with ticket ID & status history
│   ├── routes/
│   │   ├── auth.js         # Register, login, profile
│   │   ├── complaints.js   # CRUD + status updates + ticket tracking
│   │   ├── departments.js  # Department management
│   │   └── users.js        # Admin user management
│   ├── middleware/
│   │   └── auth.js         # JWT protect + role restriction
│   ├── seed.js             # Database seeder
│   └── server.js           # Express entry point
│
└── client/
    └── src/
        ├── api/axios.js         # Axios with JWT interceptor
        ├── context/AuthContext  # Auth state management
        ├── components/
        │   ├── Navbar.js        # Role-aware navigation
        │   └── StatusBadge.js   # Badge + Timeline components
        └── pages/
            ├── LandingPage.js
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── TrackPage.js     # Public ticket tracking
            ├── user/
            │   ├── UserDashboard.js
            │   ├── SubmitComplaint.js
            │   ├── MyComplaints.js
            │   └── ComplaintDetail.js
            └── manager/
                ├── ManagerDashboard.js
                ├── DepartmentComplaints.js
                ├── ComplaintManage.js   # Status update workflow
                └── AdminUsers.js        # Admin user management
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register citizen | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Get profile | Auth |
| GET | /api/departments | List departments | Public |
| POST | /api/complaints | Submit complaint | User |
| GET | /api/complaints/track/:ticketId | Track by ticket ID | Public |
| GET | /api/complaints/my | My complaints | User |
| GET | /api/complaints/department | Dept complaints | Manager |
| GET | /api/complaints/stats | Dashboard stats | Manager |
| PUT | /api/complaints/:id/status | Update status + note | Manager |
| GET | /api/users | All users | Admin |
| POST | /api/users/create-manager | Create manager | Admin |

---

## ✨ Features

- **JWT Authentication** with role-based access (User / Manager / Admin)
- **Unique Ticket IDs** (format: `TKT-XXXXXXXX`) auto-generated per complaint
- **Department routing** — complaints assigned to specific departments
- **Status workflow**: Received → Under Review → Resolved / Rejected
- **Status history timeline** with resolution notes
- **Public ticket tracking** — no login required
- **Manager dashboard** with stats and progress bars
- **Admin panel** for user and department management
- **Image link** support for complaint evidence
- **Priority levels**: Low / Medium / High
