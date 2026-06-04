# Product Requirements Document (PRD)

## Studio Recording Management System

---

## 1. Overview

Aplikasi berbasis web untuk mengelola operasional studio rekaman secara terintegrasi, mencakup manajemen client, booking studio, engineer, equipment, invoice, dan analytics.

**Tujuan:**

- Meningkatkan efisiensi operasional
- Mengurangi konflik jadwal
- Mempermudah tracking pembayaran
- Memberikan insight performa bisnis

**Deployment Target:**

- VPS BiznetGio NeoLite 1.1. (Production)
- Replit (Development)
- Browser-based (desktop & mobile)

---

## 2. Requirements

### Functional Requirements

- CRUD data client
- Booking studio (room, engineer, equipment)
- Conflict detection scheduling
- Invoice & payment tracking
- Staff & equipment management
- Dashboard analytics
- Role-based access (admin, staff, client)
- Notification system

### Non-Functional Requirements

- Lightweight & optimized
- Response time < 2 detik
- Secure authentication
- Modular architecture
- Simple UI

---

## 3. Core Features

### Client Management

- CRUD client
- Data kontak & histori
- Activity log

### Booking & Scheduling

- Multi-resource booking
- Calendar view
- Conflict detection
- Status booking

### Invoice & Payment

- Auto invoice generation
- Status tracking
- Manual payment input

### Staff & Equipment

- CRUD staff/engineer
- CRUD equipment
- Availability tracking

### Dashboard Analytics

- Revenue
- Utilization
- Client activity

### Role-Based Access

- Admin: full access
- Staff: operasional
- Client: booking only

### Notification System

- Reminder booking
- Reminder pembayaran
- Telegram Bot

---

## 4. User Flow

### Client Flow

1. Login/Register
2. Create booking
3. Receive invoice
4. Make payment
5. View history

### Staff Flow

1. Login
2. Manage booking
3. Assign resources
4. Generate invoice

### Admin Flow

1. Login
2. Monitor dashboard
3. Manage system

---

## 5. Architecture

### High-Level

Frontend -> Backend API -> Database

### Components

- Frontend: Next.js
- Backend: Django
- Database: PostgreSQL Neon 

### Deployment

- VPS BiznetGio NeoLite 1.1. (Production)
- Replit (Development)

---

## 6. Sequence Diagram

### Booking Process

1. Client request booking
2. Check availability
3. Conflict detection
4. Save booking
5. Generate invoice

### Payment Process

1. Submit payment
2. Verify
3. Update status

---

## 7. Database Schema

### Users

- id
- name
- email
- password
- role

### Clients

- id
- user\_id
- phone

### Rooms

- id
- name
- price

### Engineers

- id
- name

### Equipment

- id
- name
- status

### Bookings

- id
- client\_id
- room\_id
- engineer\_id
- start\_time
- end\_time
- status

### Invoices

- id
- booking\_id
- total
- status

### Payments

- id
- invoice\_id
- amount

---

## 8. Tech Stack

### Backend

- Django

### Frontend

- Next.js

### Database

- PostgreSQL Neon

### Deployment

- VPS BiznetGio NeoLite 1.1. (Production)
- Replit (Development)

---

## Notes

- Optimized for low resource
- Avoid heavy dependencies
- Use simple background jobs for notifications

