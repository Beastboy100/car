# MB MOTORS

Premium vehicle rental platform with identity verification (KYC) gate before booking.

---

## Project Structure

```
mb-motors/
├── index.html                   # SPA entry point
├── package.json
├── .env.example                 # environment variables template
│
├── frontend/
│   ├── css/
│   │   └── styles.css           # all styles — tokens, layout, components, pages
│   └── js/
│       └── app.js               # all client-side logic — Router, Auth, KYC, Checkout, GPS
│
├── backend/
│   ├── config/
│   │   └── server.js            # Express app, MongoDB connection, middleware setup
│   ├── routes/
│   │   ├── auth.js              # POST /api/auth/register, login, logout; GET /api/auth/me
│   │   ├── kyc.js               # POST /api/kyc/submit, verify-aadhaar, verify-pan; GET /api/kyc/status
│   │   └── bookings.js          # POST/GET /api/bookings; PUT /api/bookings/:id/cancel
│   ├── middleware/
│   │   ├── auth.js              # JWT Bearer token validation
│   │   └── kycRequired.js       # KYC gate — 403 if user.kycStatus !== 'verified'
│   └── models/
│       ├── user.js              # Mongoose User schema (includes embedded KYC subdoc)
│       └── booking.js           # Mongoose Booking schema
│
└── assets/
    ├── uploads/
    │   └── kyc/                 # uploaded identity documents (served privately)
    └── icons/
```

---

## Pages

| Page | Route (client-side) | Description |
|---|---|---|
| Home | `home` | Hero, booking bar, fleet, why, reviews, footer |
| Login | `login` | Sign in / register with email or Google |
| KYC | `kyc` | 5-step identity verification — personal info, Aadhaar, PAN, passport/voter ID, DL, selfie |
| Checkout | `checkout` | Booking form + add-ons + payment (card/UPI) |
| Confirmation | `order` | Booking confirmed, reference number, receipt |
| GPS Tracking | `gps` | Live fleet map with vehicle status and trip log |
| List Car | `list` | Owner submission form + earnings calculator |

---

## Booking Flow

```
Browse Fleet
    │
    ▼
[Login Gate]  ─── not logged in ──→  Login Page
    │
    ▼
[KYC Gate]  ─── not verified ──→  KYC Verification (5 steps)
    │                                 ├─ Step 1: Personal info
    │                                 ├─ Step 2: Aadhaar + PAN + optional docs
    │                                 ├─ Step 3: Driving Licence
    │                                 ├─ Step 4: Selfie with Aadhaar
    │                                 └─ Step 5: Review & consent
    ▼
Checkout Page
    │   ├─ Driver details
    │   ├─ Rental details
    │   ├─ Optional add-ons
    │   └─ Payment (Card / UPI)
    ▼
Order Confirmation
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET  | `/api/auth/me` | Current user profile |

### KYC
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/kyc/submit` | Upload identity documents |
| GET  | `/api/kyc/status` | Get verification status |
| POST | `/api/kyc/verify-aadhaar` | Verify Aadhaar number |
| POST | `/api/kyc/verify-pan` | Verify PAN number |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create booking (requires verified KYC) |
| GET  | `/api/bookings` | List user bookings |
| GET  | `/api/bookings/:id` | Get single booking |
| PUT  | `/api/bookings/:id/cancel` | Cancel booking |

---

## Setup

### Frontend only (no backend)
```bash
# Just open index.html — no build step required.
npx serve . -l 3000
# Visit http://localhost:3000
```

### Full stack
```bash
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET

npm install
npm run dev
# Visit http://localhost:5000
```

### Environment variables
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mb_motors
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=http://localhost:3000
```

---

## Identity Documents Accepted

| Document | Type | Required |
|---|---|---|
| Aadhaar Card (front + back) | Primary ID | ✅ Mandatory |
| PAN Card | Primary ID | ✅ Mandatory |
| Passport | Secondary ID | Optional |
| Voter ID (EPIC) | Secondary ID | Optional |
| Driving Licence (front + back) | Licence | ✅ Mandatory |
| Selfie holding Aadhaar | Liveness check | ✅ Mandatory |

All uploads are private, encrypted at rest, and never served publicly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML · CSS (custom properties) · JavaScript ES2022 (no framework) |
| Backend | Node.js · Express 4 |
| Database | MongoDB · Mongoose |
| Auth | JWT (jsonwebtoken) · bcryptjs |
| File uploads | Multer |
| Validation | express-validator |
| Security | helmet · express-rate-limit · CORS |

---

## License

MIT
