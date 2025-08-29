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
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, CSV-Parser, XLSX
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

Before running the application, ensure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB server (local or cloud, e.g. MongoDB Atlas)

## Setup Instructions

### 1. Environment Configuration


Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=your_db_name_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```


### 2. Database Setup

The application uses MongoDB as the database. You'll need to:

1. Install and run MongoDB locally, or create a cloud database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
2. Update your `.env` file with your MongoDB connection string and database name
3. Collections will be created automatically on first use
4. See the Database Schema section for recommended document structure

### 3. Installation

```bash
# Install dependencies
npm install

# Start the development server (runs both backend and frontend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Database Schema


### Users Collection (MongoDB)
```json
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "password": String,
  "role": "admin",
  "created_at": ISODate,
  "updated_at": ISODate,
  "last_login": ISODate
}
```


### Agents Collection (MongoDB)
```json
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "mobile": String,
  "country_code": String,
  "password": String,
  "status": "active",
  "created_by": ObjectId,
  "created_at": ISODate,
  "updated_at": ISODate
}
```


### Uploads Collection (MongoDB)
```json
{
  "_id": ObjectId,
  "filename": String,
  "original_count": Number,
  "uploaded_by": ObjectId,
  "status": "processing",
  "created_at": ISODate,
  "processed_at": ISODate
}
```


### Assigned Lists Collection (MongoDB)
```json
{
  "_id": ObjectId,
  "agent_id": ObjectId,
  "upload_id": ObjectId,
  "first_name": String,
  "phone": String,
  "notes": String,
  "status": "pending",
  "created_at": ISODate
}
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

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Update CORS origins in `server/index.js`
3. Use a secure JWT secret
4. Configure proper database security rules
5. Set up SSL/TLS certificates
6. Use a process manager like PM2

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
  - Verify MongoDB URL and database name in `.env`
  - Check if MongoDB server is running and accessible
  - Ensure collections exist and are properly structured

2. **File Upload Issues**
   - Check file format (CSV, XLS, XLSX only)
   - Verify required columns exist
   - Ensure file size is under 5MB

3. **Authentication Problems**
   - Verify JWT secret is set
   - Check token expiration
   - Ensure user exists in database

### Debug Mode

Set `NODE_ENV=development` to enable:
- Detailed error messages
- Stack traces in API responses
- Development CORS settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation