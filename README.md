# MERN Stack Agent Management System

A comprehensive application for managing sales agents and distributing leads from CSV/Excel files.

## Features

### 🔐 Admin Authentication
- Secure JWT-based authentication system
- Protected routes and API endpoints
- Session management with token validation

### 👥 Agent Management
- Create, read, update, and delete agents
- Agent profile management with contact details
- Status tracking (active/inactive)
- Mobile number with country code support

### 📤 File Upload & Distribution
- Upload CSV, XLS, and XLSX files
- Automatic validation of file format and required columns
- Intelligent distribution algorithm among active agents
- Equal distribution with sequential assignment for remainders
- Real-time upload progress and result display

### 📊 Dashboard & Analytics
- Overview of system statistics
- Recent upload history
- Agent status monitoring
- Distribution visualization

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with MongoDB Compass
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, CSV-Parser, XLSX
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

Before running the application, ensure you have installed:

- **Node.js** (v16 or higher) - [Download from official website](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- **MongoDB Community Server** - [Download from MongoDB](https://www.mongodb.com/try/download/community)
- **MongoDB Compass** (GUI for MongoDB) - [Download from MongoDB](https://www.mongodb.com/try/download/compass)

## Complete Setup Instructions

### 1. MongoDB Setup with MongoDB Compass

#### Step 1.1: Install MongoDB Community Server
1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install it with default settings
3. Make sure MongoDB service is running (it should start automatically)

#### Step 1.2: Install MongoDB Compass
1. Download MongoDB Compass from [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
2. Install and open MongoDB Compass
3. Connect to your local MongoDB instance using the default connection string: `mongodb://localhost:27017`

#### Step 1.3: Create Database
1. In MongoDB Compass, click "Create Database"
2. Database Name: `agent_management_db` (or any name you prefer)
3. Collection Name: `users` (first collection)
4. Click "Create Database"

### 2. Environment Configuration

Create a `.env` file in the root directory of the project:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=agent_management_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
JWT_EXPIRE=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 3. Project Installation

```bash
# Clone or navigate to the project directory
cd path/to/your/project

# Install all dependencies
npm install

# Make sure MongoDB is running (check in MongoDB Compass)
# You should see your database listed in Compass
```

### 4. Database Seeding (Create Admin User and Sample Agents)

#### Step 4: Create Admin User
```bash
# Run the admin seeding script
node server/seedAdmin.js
```
This will create an admin user with:
- **Email**: `admin@example.com`
- **Password**: `admin123`

### 5. Running the Application

#### Option A: Run Both Frontend and Backend Together
```bash
npm run dev
```

#### Option B: Run Separately (for debugging)
```bash
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend development server
npm run client
```

### 6. Access the Application

1. **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your browser
2. **Backend API**: Available at [http://localhost:3001](http://localhost:3001)
3. **MongoDB Compass**: View your database at `mongodb://localhost:27017`

### 7. Login Credentials

Use these credentials to access the admin panel:
- **Email**: `admin@example.com`
- **Password**: `admin123`

## Quick Start Guide

1. **Install Prerequisites**: MongoDB Community Server + Compass, Node.js
2. **Setup Database**: Open Compass, create database `agent_management_db`
3. **Clone Project**: Download/clone the project files
4. **Install Dependencies**: Run `npm install`
5. **Configure Environment**: Create `.env` file with MongoDB connection
6. **Seed Database**: Run `node server/seedAdmin.js`
7. **Start Application**: Run `npm run dev`
8. **Access Application**: Visit [http://localhost:5173](http://localhost:5173)
9. **Login**: Use `admin@example.com` / `admin123`

## Viewing Data in MongoDB Compass

After running the application, you can view and manage your data in MongoDB Compass:

1. **Open MongoDB Compass** and connect to `mongodb://localhost:27017`
2. **Navigate to your database** (`agent_management_db`)
3. **View Collections**:
   - `users` - Admin user accounts
   - `agents` - Sales agent profiles
   - `uploads` - File upload history
   - `assigned_lists` - Distribution records

You can use Compass to:
- Browse documents in each collection
- Run queries to filter data
- View statistics and indexes
- Monitor real-time changes as you use the app

## Database Schema

The application uses MongoDB with the following collections. You can view these in MongoDB Compass after seeding:

### Users Collection (Admin Accounts)
```json
{
  "_id": ObjectId,
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "hashed_password_with_bcrypt",
  "role": "admin",
  "created_at": "2025-08-29T10:30:00.000Z",
  "updated_at": "2025-08-29T10:30:00.000Z",
  "last_login": "2025-08-29T10:30:00.000Z"
}
```

### Agents Collection (Sales Agents)
```json
{
  "_id": ObjectId,
  "name": "Agent Name",
  "email": "agent@example.com",
  "mobile": "1234567890",
  "country_code": "+1",
  "password": "hashed_password_with_bcrypt",
  "status": "active",
  "created_by": ObjectId("admin_user_id"),
  "created_at": "2025-08-29T10:30:00.000Z",
  "updated_at": "2025-08-29T10:30:00.000Z"
}
```

### Uploads Collection (File Upload History)
```json
{
  "_id": ObjectId,
  "filename": "customer_list.csv",
  "original_count": 25,
  "uploaded_by": ObjectId("admin_user_id"),
  "status": "completed",
  "created_at": "2025-08-29T10:30:00.000Z",
  "processed_at": "2025-08-29T10:30:00.000Z"
}
```

### Assigned Lists Collection (Distribution Records)
```json
{
  "_id": ObjectId,
  "agent_id": ObjectId("agent_id"),
  "upload_id": ObjectId("upload_id"),
  "first_name": "John Doe",
  "phone": "1234567890",
  "notes": "Sample customer note",
  "status": "pending",
  "created_at": "2025-08-29T10:30:00.000Z"
}
```

## MongoDB Compass Navigation

After seeding your database, you can explore the data structure in MongoDB Compass:

1. **Connect to Database**: `mongodb://localhost:27017/agent_management_db`
2. **Browse Collections**:
   - `users` → View admin accounts
   - `agents` → Browse all sales agents
   - `uploads` → Check file upload history
   - `assigned_lists` → See how records were distributed

3. **Sample Queries in Compass**:
   ```javascript
   // Find all active agents
   { "status": "active" }
   
   // Find uploads from today
   { "created_at": { "$gte": new Date("2025-08-29") } }
   
   // Find assigned records for specific agent
   { "agent_id": ObjectId("your_agent_id_here") }
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get current user profile

### Agents
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get single agent
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Upload & Distribution
- `POST /api/upload/distribute` - Upload and distribute file
- `GET /api/upload/history` - Get upload history
- `GET /api/upload/:uploadId/distribution` - Get distribution details

## How to Use the Application

### 1. Login as Admin
1. Navigate to [http://localhost:5173](http://localhost:5173)
2. Use credentials: `admin@example.com` / `admin123`
3. You'll be redirected to the dashboard

### 2. Manage Agents
1. Click "Agents" in the sidebar
2. **Add New Agent**: Click "Add Agent" button
   - Fill in: Name, Email, Mobile (with country code), Password
   - Agent will be created with "active" status
3. **Edit Agent**: Click edit icon to modify agent details
4. **Toggle Status**: Click "Set active/inactive" to change agent status
5. **Delete Agent**: Click delete icon (with confirmation)

### 3. Upload and Distribute Files
1. Click "Upload & Distribute" in the sidebar
2. **Download Template**: Click "Download Template" for correct CSV format
3. **Upload File**: 
   - Drag & drop your CSV/Excel file or click "Choose File"
   - Supported formats: `.csv`, `.xls`, `.xlsx`
   - Maximum size: 5MB
4. **Review Distribution**: See how records are distributed among active agents
5. **View in Compass**: Check `uploads` and `assigned_lists` collections

### 4. Monitor Dashboard
1. Click "Dashboard" to see:
   - Total agents and active agent count
   - Upload statistics and history
   - Recent activity overview

### 5. View Data in MongoDB Compass
1. Open MongoDB Compass
2. Navigate to your database collections
3. See real-time data updates as you use the app

## File Format Requirements

### CSV Format
```csv
FirstName,Phone,Notes
John Doe,1234567890,Sample note
Jane Smith,0987654321,Another sample note
```

### Supported File Types
- CSV (.csv)
- Excel (.xls, .xlsx)

### File Size Limit
- Maximum: 5MB per file

## Distribution Algorithm

The system distributes records using the following logic:

1. **Equal Distribution**: Records are divided equally among all active agents
2. **Sequential Assignment**: If records don't divide evenly, remaining records are assigned sequentially starting from the first agent
3. **Example**: 
   - 25 records ÷ 5 agents = 5 records each
   - 27 records ÷ 5 agents = 5 records each + 2 extra records to first 2 agents

## Security Features

- JWT-based authentication with configurable expiration
- Password hashing using bcryptjs
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for production
- Helmet.js for security headers
- Row Level Security (RLS) on database tables

## Development Scripts

```bash
# Development (both frontend and backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Seed sample agents
node server/seedAgents.js
```

## Project Structure

```
project/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── Login.tsx      # Admin login form
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── Agents.tsx     # Agent management
│   │   ├── Upload.tsx     # File upload & distribution
│   │   └── Layout.tsx     # App layout wrapper
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   └── App.tsx           # Main app component
├── server/                # Backend Express application
│   ├── config/           # Configuration files
│   │   └── database.js   # MongoDB connection
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   └── errorHandler.js # Error handling
│   ├── routes/           # API routes
│   │   ├── auth.js       # Authentication routes
│   │   ├── agents.js     # Agent CRUD routes
│   │   └── upload.js     # File upload routes
│   ├── seedAdmin.js      # Admin user seeding script
│   ├── seedAgents.js     # Agent seeding script
│   └── index.js          # Express server entry point
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Technology Stack Details

- **Frontend Framework**: React 18 with TypeScript for type safety
- **Backend Framework**: Express.js for RESTful API
- **Database**: MongoDB with native driver for data persistence
- **Authentication**: JSON Web Tokens (JWT) for secure sessions
- **File Processing**: Multer for uploads, CSV-Parser and XLSX for file parsing
- **UI Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for modern icon set
- **Development**: Vite for fast development and building

## Production Deployment

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Update CORS origins in `server/index.js`
3. Use a secure JWT secret (long random string)
4. Use MongoDB Atlas for cloud database
5. Set up SSL/TLS certificates
6. Use a process manager like PM2 for Node.js
7. Configure proper firewall rules
8. Set up monitoring and logging

**Happy coding! 🚀**
