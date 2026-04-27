<div align="center">

# 🔄 SplitSync

**Real-Time Collaborative Expense Splitting & Settlement Engine**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)](https://redis.io/)

<br/>

🌐 **[Live App](https://split-sync-web.vercel.app)** &nbsp;|&nbsp; ⚡ **[API Health](https://splitsync-backend-rm30.onrender.com/health)**

</div>

---

## 📖 About

SplitSync is a full-stack web application that lets groups of friends, roommates, or colleagues track shared expenses and settle debts intelligently. It uses a **debt simplification algorithm** to minimize the number of transactions needed to settle all balances, and **Socket.io** to sync changes across all members in real-time — no page refresh needed.

---

## 🛠️ Technologies

### Frontend
`Next.js 14` `TypeScript` `Tailwind CSS` `shadcn/ui` `TanStack Query v5` `Zustand` `Socket.io Client` `Recharts` `Framer Motion` `React Hook Form` `Zod` `Axios`

### Backend
`Node.js` `Express` `TypeScript` `Socket.io` `Prisma ORM` `PostgreSQL` `Redis` `BullMQ` `node-cron` `Nodemailer` `Cloudinary` `PDFKit` `Helmet` `Zod` `Winston` `decimal.js`

### Infrastructure
`Vercel` `Render` `Neon.tech (PostgreSQL)` `Upstash (Redis)` `Cloudinary` `Gmail SMTP` `GitHub Actions` `Docker`

---

## ✨ Features

### 🔐 Authentication
- Register / Login with email & password
- JWT access tokens (15min) + refresh token rotation
- httpOnly cookies for XSS-safe session management
- Token theft detection — invalidates all sessions
- Forgot password & reset via email link
- Logout from all devices

### 👥 Groups
- Create groups with name, type (Trip, Home, Couple, Event etc.) and description
- Join groups via unique 8-character invite code
- Admin & Member role system
- Promote / demote members
- Remove members from group
- Regenerate invite code
- Leave group (with admin transfer protection)
- Archive group when everyone leaves

### 💰 Expenses
- Add expenses with 4 split types:
  - **Equal** — split evenly, remainder pennies distributed fairly
  - **Exact** — specify exact amount per person (validated against total)
  - **Percentage** — specify % per person (must sum to 100%)
  - **Shares** — proportional split using share ratio
- 15 expense categories (Food, Transport, Hotel, Entertainment etc.)
- Set who paid (any group member)
- Multi-currency support (20 currencies — INR, USD, EUR, GBP etc.)
- Live exchange rates via frankfurter.app (updated every 6 hours)
- Upload receipt images (Cloudinary + Sharp optimization)
- Filter by category, payer, search by title
- Sort by date or amount
- Paginated expense list
- Soft delete (history preserved)

### 📝 Expense History & Versioning
- Full audit trail on every create / edit / delete
- Before → after diff view (strikethrough old, green new)
- Optimistic concurrency control (version locking)
- Conflict detection — shows warning if someone else edited first

### ⚖️ Balances & Debt Simplification
- Real-time net balance per member (paid − owed − settled)
- **Min-Cash-Flow algorithm** — reduces N×(N-1) pairwise debts to max N-1 transfers
- Shows "X fewer transfers" optimization badge
- Before vs after comparison (naive count vs simplified)
- Per-member breakdown: total paid, total owed, net balance
- Global balance page — your net balance across ALL groups

### 💳 Settlements & UPI Payments
- Record settlements manually
- **Pay via UPI deep links** — opens GPay / PhonePe / Paytm / BHIM with amount pre-filled
- Settlement history with arrows (payer → receiver)
- Balances update in real-time after settlement
- Email notification sent to recipient on settlement

### ⚡ Real-Time (Socket.io)
- Expenses appear on all members' screens instantly (no refresh)
- Balance tab updates automatically after any change
- 🟢 Live indicator in navbar (green animated dot)
- Presence indicators — see who is currently online
- Typing indicators — "Alice is typing..." with bouncing dots
- Toast notifications for group activity (new expense, member joined etc.)
- Member list updates live when someone joins or leaves

### 🔔 Notifications
- In-app notification bell with unread count badge
- Real-time delivery via Socket.io
- Notifications for: expense added, settlement received, member joined
- Mark one as read / Mark all as read
- Full notifications page with history
- Email notifications via Gmail SMTP:
  - Welcome email on registration
  - Expense added (to all group members)
  - Settlement received
  - Payment reminders

### 🔄 Recurring Expenses
- Set expenses to repeat: Daily / Weekly / Monthly / Yearly
- CRON job runs every hour to create due expenses automatically
- Pause / Resume recurring rules
- Delete rules without affecting past expenses
- Notifications sent when recurring expense is created

### ⏰ Payment Reminders
- Automated daily reminders (9 AM) for outstanding debts
- 7-day cooldown — no spam (one reminder per debt per week)
- Minimum ₹10 threshold (ignores tiny debts)
- In-app + email reminder sent to debtor

### 📊 Analytics
- **Summary cards** — total expenses, avg per expense, this month vs last month, top category
- **Line chart** — spending trend (Daily / Weekly / Monthly toggle)
- **Donut chart** — spending breakdown by category with percentages
- **Bar chart** — member contributions (paid vs owed per person)
- Group analytics page + global analytics across all groups

### 📄 PDF Export
- Download branded expense report as PDF
- Includes: summary, category breakdown, full expense table, member balances, settlement suggestions
- Automatic page breaks for large groups
- Page numbers in footer

### 🗂️ Activity Feed
- Unified timeline: expenses + settlements + group joins
- Color-coded icons (blue = you paid, orange = split, green = received)
- Filter by: All / Expenses / Settlements / Groups
- Clicking item navigates to relevant group
- Real-time updates via Socket.io

### ⚙️ Settings
- Edit display name (inline)
- Change default currency (20 options)
- Change timezone
- Change password
- Sign out from all devices

### 🛡️ Security
- BCrypt password hashing (12 rounds)
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- 5-tier rate limiting:
  - Global: 100 req/min per IP
  - Auth: 10 req/min per IP
  - Password reset: 5 req/15min per IP
  - API: 60 req/min per user
  - Upload: 5 req/min per user
- Input validation with Zod on all endpoints
- CORS origin validation
- SQL injection prevention (Prisma parameterized queries)

### 📱 Mobile Responsive
- Bottom tab bar for mobile navigation
- Fullscreen expense detail panel on mobile
- Horizontal scroll filters on small screens
- Touch-friendly tap targets (min 44px)
- Safe area padding for notched phones

### 🧪 Testing
- **33 unit tests** — split calculation engine + debt simplification algorithm
- **23 integration tests** — auth endpoints + expense CRUD
- **56 tests total** — Jest + Supertest
- GitHub Actions CI runs all tests on every push

---

## 🚀 Local Development

```bash
# Clone
git clone https://github.com/Tp20000/SplitSync.git
cd SplitSync

# Install
npm install

# Start Docker (PostgreSQL + Redis)
docker-compose up -d

# Backend
cd apps/server
cp .env.example .env        # fill in values
npx prisma migrate dev
npm run dev                  # http://localhost:5000

# Frontend (new terminal)
cd apps/web
cp .env.example .env.local  # fill in values
npm run dev                  # http://localhost:3000
