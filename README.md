# 🛠️ MediQueue Server

MediQueue Server is the backend API service for the MediQueue Tutor Booking Platform. It handles tutor management, booking operations, authentication verification, and secure database communication using MongoDB and JWT-based authorization.

---

# 🌐 Server Live URL

🔗 https://your-server-live-url.com

---

# 🚀 Core Features

- 🔐 JWT Protected Private Routes
- 👨‍🏫 Tutor CRUD Operations
- 📅 Smart Booking Management System
- 🔄 Automatic Slot Increase & Decrease Logic
- 🔍 Tutor Search & Date Filtering APIs
- 🛡️ Secure MongoDB Database Integration
- ⚡ Fast Express.js REST API
- 🌍 CORS Enabled Backend Service
- 📦 Environment Variable Protected Credentials
- ✅ Error Handling & Validation System

---

# 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- JOSE JWT Runtime
- Better Auth JWKS
- dotenv
- cors

---

# 📦 Dependencies

```json
{
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "jose-node-cjs-runtime": "^5.10.0",
  "mongodb": "^7.2.0"
}
```

---

# 📁 Project Structure

```bash
mediqueue-server/
├── index.js
├── package.json
├── .env
└── node_modules/
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=8008
MONGO_URI=your_mongodb_connection_uri
CLIENT_URL=your_client_url
```

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone https://github.com/your-username/mediqueue-server.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Run the Server

```bash
node index.js
```

Server will run on:

```bash
http://localhost:8008
```

---

# 📡 API Endpoints

| Method | Endpoint | Description | Security |
|--------|----------|-------------|----------|
| POST | `/tutors` | Add a new tutor to the database | Public |
| GET | `/tutors` | Get all tutors with search & date filters | Public |
| GET | `/featured-tutors` | Get top 6 latest tutors | Public |
| GET | `/tutors/:id` | Get single tutor details | JWT Protected |
| POST | `/bookings` | Create booking & decrease slot automatically | JWT Protected |
| GET | `/my-tutors/:userId` | Get tutors created by specific user | JWT Protected |
| GET | `/bookings/:userId` | Get bookings created by user | JWT Protected |
| PATCH | `/bookings/:id` | Cancel booking & increase slot | JWT Protected |
| PATCH | `/tutors/:id` | Update tutor information | JWT Protected |
| DELETE | `/tutors/:id` | Delete tutor & cancel related bookings | JWT Protected |

---

# 🔐 Authentication System

This server uses JWT verification through JOSE Remote JWK Set.

## Security Features

- JWT Token Validation
- Authorization Middleware
- Protected Private APIs
- Secure Request Verification
- Environment Variable Protection

---

# 🧠 Backend Functionalities

## Tutor Management

- Add tutor sessions
- Update tutor information
- Delete tutor sessions
- Fetch all tutors
- Filter tutors by search and date

## Booking System

- Create bookings
- Prevent overbooking
- Automatically decrease available slots
- Cancel bookings
- Restore slots after cancellation

---

# ⚡ Booking Logic

The backend automatically:

- Prevents booking before session start date
- Blocks booking if slots are unavailable
- Decreases slot count after successful booking
- Restores slot count after cancellation

---

# ❌ Error Handling

The API includes proper error handling for:

- Unauthorized access
- Invalid JWT token
- Missing data
- Invalid tutor IDs
- Booking restrictions
- Database errors

---

# 👨‍💻 Developer

### Ashik Ahammad

