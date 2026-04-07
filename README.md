# TapTrust — Home Services Platform

> Tap once. Trust always.

TapTrust connects urban households with background-verified home service professionals. Transparent pricing, real-time tracking, quality guaranteed.

---

## Tech Stack

**Frontend** — React + Vite  
**Backend** — Node.js + Express  
**Database** — MySQL (via XAMPP)  
**Auth** — JWT (30-day sessions)  
**Testing** — Jest + Property-Based Tests (fast-check)

---

## Project Structure

```
TapTrust/
├── frontend/          # React app (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Main landing + auth modal
│   │   │   ├── LoginPage.jsx         # Standalone login
│   │   │   └── ProviderDashboard.jsx # Full provider portal
│   │   ├── components/
│   │   └── App.jsx
│   └── public/
│       └── logo.png
│
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── migrations/    # SQL schema files
│   └── tests/         # Property-based tests
│
└── README.md
```

---

## Features

### Landing Page
- Hero section with phone mockup
- 12 service categories with expandable sub-services
- Book a Service form with payment options
- How it works, Professionals, Reviews, Footer
- Auth modal (Sign In / Sign Up) with Customer/Provider role

### Customer
- Sign in → profile avatar + name in navbar
- My Bookings & Payment History on landing page
- Book any service with date, time, location, payment method

### Service Provider Dashboard
- Overview stats (bookings, earnings, rating)
- Online/Offline toggle
- View & Accept/Reject booking requests
- Active jobs with status updates (Start → Complete)
- Earnings (daily/weekly/monthly)
- Payment history + withdrawal requests
- Settings (location, pricing, time slots)
- Notifications

### Admin
- Separate admin portal at `/admin/dashboard`

---

## Services Covered

| Category | Sub-services |
|---|---|
| 🔧 Plumbing | Tap repair, Pipe leakage, RO installation, Water motor repair... |
| ⚡ Electrical | Wiring, CCTV, Smart home, Generator setup... |
| 🧹 Deep Cleaning | Full home, Post-construction, Water tank, Mattress... |
| 🪚 Carpentry | Cupboard, Kitchen fittings, Bed assembly, Flooring... |
| ❄️ AC & Appliances | AC repair/install, Geyser, Chimney, Dishwasher... |
| 🎨 Painting | Interior, Texture, Wallpaper, False ceiling... |
| 🐛 Pest Control | Cockroach, Termite, Bed bugs, Rodent... |
| 🗄️ Handyman | Mirror, Door lock, Drilling, Shelf install... |
| 🌿 Outdoor Services | Garden, Tree trimming, Terrace cleaning... |
| 🔒 Safety & Security | CCTV, Fire alarm, Motion sensors, Intercom... |
| 📦 Moving & Packing | Home/office relocation, Storage, Packing... |
| 📱 Tech Services | WiFi setup, Smart TV, Laptop repair, Screen replacement... |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL (XAMPP recommended)
- Git


### Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run migrate   # Run database migrations
npm start         # Starts on port 5000
```

### Frontend setup
```bash
cd frontend
npm install
npm run dev       # Starts on port 3000
```

###  Open in browser
```
http://localhost:3000
```

## Environment Variables

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=taptrust
JWT_SECRET=your_secret_key
PORT=5000
```

## Default Admin Account
```
Email: xyz@gmai.com
Password:......



## Running Tests
```bash
cd backend
npm test
```
61 property-based tests covering auth, bookings, payments, reviews, notifications, and more.



