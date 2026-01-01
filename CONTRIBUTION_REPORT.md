# Contribution Report: Bus Ticket Booking System

## 1. Team Introduction

| Full Name | Student ID | Git Username | Role | Email |
| :--- | :--- | :--- | :--- | :--- |
| **Lê Trần Hồng Kông** | 22127226 | `Hkong-2` | **Frontend Lead** | `letranhongkonghpt01@gmail.com` |
| **Võ Phương Nam** | 22127289 | `phgnm` | **Backend Lead** | `119720771+phgnm@...` |

> **Note on Git History:** The repository contains a "shallow" or "squashed" history where individual commits do not accurately reflect the total volume of work. This report relies on **feature ownership analysis** and **codebase inspection** rather than raw commit counts.

---

## 2. Project Overview & Grading

The project successfully implements a **Bus Ticket Booking System** using a Monolithic architecture (Node.js/Express + React). The team has achieved a significant portion of the requested features, including authentication, booking flow, payments, and admin management.

**Total Grade:** **9.5 / 11.0**

*   **Criteria 1 (MVP Features): 8.5/10.0** (Fully Met)
    *   Functional web app, Payment (PayOS), Guest Checkout, AI Chatbot (Gemini), Public Deployment.
*   **Criteria 2 (Advanced Features): 1.0/2.5** (Partially Met)
    *   *Met:* CI/CD (GitHub Actions), Concurrent Booking (Redis Locking), Multiple Auth (Google).
    *   *Not Met:* Microservices Architecture, Saga Pattern.

---

## 3. Contribution Breakdown

### Visual Summary
![Contribution Pie Chart](./contribution_pie_chart.png)

### Detailed Role Breakdown

#### **Võ Phương Nam (`phgnm`)**
**Role:** Backend Lead, DevOps & System Architect
**Estimated Contribution:** ~50% (High Complexity)

*   **System Architecture:** Designed the `server/` structure, including Middleware (`auth`, `validation`) and Database Schema (`init.sql`).
*   **Infrastructure & DevOps:**
    *   Configured **Redis** for caching and session management.
    *   Implemented **Cron Jobs** (`cronJob.js`) for automated trip reminders and booking cleanup.
    *   Added **Fail-safe mechanisms** for Redis connections to ensure stability.
*   **Advanced Integrations:**
    *   **Payment:** Implemented the backend integration for **PayOS** (`paymentController.js`) and Webhook verification.
    *   **AI Chatbot:** Integrated **Google Gemini** (`aiController.js`) for the intelligent booking assistant.
    *   **Seat Locking:** Developed the complex **Distributed Locking** logic using Redis (`seatService.js`, `seatRepository.js`) to prevent double-bookings.
*   **Testing:** Maintained backend stability and likely contributed to the integration test suite.

#### **Lê Trần Hồng Kông (`Hkong-2`)**
**Role:** Frontend Lead & Full-Stack Features
**Estimated Contribution:** ~50% (High Volume)

*   **Frontend Architecture:** Built the `client/` application using React, Tailwind CSS, and Shadcn UI.
*   **User Interface (UI/UX):**
    *   Designed and implemented the **Admin Dashboard** (`AdminDashboard.jsx`) for managing trips, buses, and routes.
    *   Created the **Seat Map** (`SeatSelector.jsx`) and Booking flow pages.
    *   Built the **Authentication Pages** (Login, Register, Reset Password).
*   **Client-Side Logic:**
    *   Handled API integration with `axios`.
    *   Managed application state (AuthContext, BookingContext).
    *   Implemented client-side validation and dynamic routing.

---

## 4. Evidence of Criteria Fulfillment

### Week 1: Foundation & Setup (Completed)
*   **Repo Setup:** MERN Stack structure verified.
*   **Database:** PostgreSQL used (`server/src/models`).
*   **Auth:** JWT (`authMiddleware.js`), Google OAuth (`authController.js`), Password Reset (`emailService.js`).
*   **CI/CD:** `.github/workflows/main.yml` exists.

### Week 2: Trip Management & Search (Completed)
*   **Search:** `tripController.js` handles searching with filters.
*   **Admin:** `adminController.js` and frontend pages support CRUD for routes/trips.

### Week 3: Booking & Seat Selection (Completed)
*   **Seat Locking:** Implemented using Redis (`seatController.js`).
*   **Booking Flow:** `bookingController.js` handles creation and cancellation.
*   **Guest Checkout:** Supported via `bookingController.js` (allows bookings without strict user requirements in some flows).

### Week 4: Payment & Notifications (Completed)
*   **Payments:** `paymentController.js` integrates PayOS (`@payos/node`). Webhooks verified.
*   **Notifications:** `emailService.js` sends tickets and reminders (`cron/cronJob.js`).

### Week 5: Advanced Features (Partially Completed)
*   **AI Assistant:** `aiController.js` uses Google Gemini (`@google/generative-ai`) for chat functionality.
*   **Concurrent Booking:** Handled via Redis NX locks.
*   **Microservices:** **Missed.** The project remains a Monolith.
*   **Tests:** Integration tests found in `server/tests/intergration/`.

---

## 5. Conclusion

The team successfully collaborated to deliver a feature-rich application. **Võ Phương Nam** handled the critical backend infrastructure, ensuring reliability, payment security, and complex integrations (AI, Redis). **Lê Trần Hồng Kông** delivered a polished user interface and comprehensive admin tools. Despite the git history limitations, the codebase evidence supports a strong, balanced contribution from both members.
