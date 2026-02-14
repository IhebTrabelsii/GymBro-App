# GymBro Backend

A modern, secure Node.js/Express backend API for a gym management system. Built with MongoDB, JWT authentication, and role-based access control.

## Features

✨ **User Management**
- User registration and authentication
- Secure password hashing with bcryptjs
- JWT-based session management
- User profile management

🔐 **Admin Features**
- Admin role-based access control
- Admin user management
- Middleware for protecting admin routes

📰 **News & Content**
- News management endpoints
- Content distribution system

🛡️ **Security**
- JWT token authentication
- Password hashing with bcryptjs
- CORS protection
- Environment variable configuration
- Role-based authorization

## Tech Stack

- **Backend Framework:** Express.js 5.1
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JWT (jsonwebtoken), bcryptjs
- **Environment Management:** dotenv
- **HTTP:** CORS-enabled
- **Development:** Nodemon

## Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas cloud database)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gymbro-backend.git
   cd gymbro-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the root directory
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

5. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gymbro

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=ChangeMe123!
CREATE_DEFAULT_ADMIN=true

# Server
NODE_ENV=development
PORT=3000
```

### Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ Yes | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for signing JWT tokens |
| `ADMIN_EMAIL` | ❌ No | Email for default admin account |
| `ADMIN_INITIAL_PASSWORD` | ❌ No | Initial password for default admin |
| `CREATE_DEFAULT_ADMIN` | ❌ No | Set to 'true' to create default admin on startup |
| `NODE_ENV` | ❌ No | Environment (development/production) |
| `PORT` | ❌ No | Server port (default: 3000) |

## Project Structure

```
gymbro-backend/
├── models/                  # Mongoose schemas
│   ├── User.js             # User model with auth fields
│   ├── Admin.js            # Admin model
│   └── Plan.js             # Plan/subscription model
├── routes/                 # API route handlers
│   ├── userRoutes.js       # User endpoints
│   ├── adminRoutes.js      # Admin endpoints
│   └── newsRoutes.js       # News endpoints
├── middleware/             # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── adminAuth.js        # Admin authorization
│   └── requireAdmin.js     # Admin role checks
├── controllers/            # Business logic (optional)
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (git ignored)
└── README.md              # This file
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/users/signup` | Register new user | ❌ |
| `POST` | `/api/users/login` | Login user | ❌ |
| `GET` | `/api/users/profile` | Get user profile | ✅ |
| `PUT` | `/api/users/profile` | Update user profile | ✅ |

### Admin Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/admin/login` | Admin login | ❌ |
| `GET` | `/api/admin/users` | List all users | ✅ Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user | ✅ Admin |

### News Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/news` | Get all news | ❌ |
| `POST` | `/api/news` | Create news | ✅ Admin |
| `PUT` | `/api/news/:id` | Update news | ✅ Admin |
| `DELETE` | `/api/news/:id` | Delete news | ✅ Admin |

## Getting Started

### 1. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get your connection string
- Add your IP to the whitelist

### 2. Configure Environment

Update your `.env` file with your MongoDB URI and JWT secret:

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gymbro
JWT_SECRET=$(openssl rand -base64 32)
```

### 3. Create Default Admin (Optional)

The server will automatically create a default admin if you set:
```env
CREATE_DEFAULT_ADMIN=true
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=ChangeMe123!
```

Or use the admin creation script:
```bash
npm run create-admin
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://0.0.0.0:3000`

## Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Create new admin user (interactive)
npm run create-admin

# Run tests
npm test
```

## Authentication Flow

1. **Signup/Login:** User sends credentials to `/api/users/signup` or `/api/users/login`
2. **JWT Token:** Server returns a JWT token
3. **Protected Routes:** Include token in `Authorization` header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
4. **Verification:** Middleware verifies token and extracts user info
5. **Access:** User can access protected endpoints

## Security Best Practices

- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ JWT tokens for stateless authentication
- ✅ CORS enabled for cross-origin requests
- ✅ Environment variables for sensitive data
- ✅ Role-based access control (RBAC)
- ⚠️ **TODO:** Rate limiting (consider `express-rate-limit`)
- ⚠️ **TODO:** Input validation (consider `joi` or `zod`)

## Troubleshooting

### MongoDB Connection Error
```
❌ DB connect error: MongooseError
```
- Check your `MONGO_URI` in `.env`
- Verify MongoDB is running (local) or your IP is whitelisted (Atlas)
- Check database user credentials

### JWT_SECRET Error
```
❌ JWT_SECRET is not defined in environment variables
```
- Ensure `.env` file exists in root directory
- Add `JWT_SECRET` to `.env`
- Restart the server

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change `PORT` in `.env` or kill process using port 3000
- On Windows: `netstat -ano | findstr :3000`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

Found a bug? Have a suggestion? [Open an issue](https://github.com/yourusername/gymbro-backend/issues) on GitHub.

---

Made with ❤️ for fitness enthusiasts
