# GymBro Backend

A modern, secure Node.js/Express backend API for a comprehensive gym management system. Built with MongoDB, JWT authentication, role-based access control, email services, and Stripe payment integration.

## Features

✨ **User Management**
- User registration and authentication
- Email verification system
- Secure password hashing with bcryptjs
- JWT-based session management
- Password reset functionality
- User profile management

💳 **Payment & Subscription**
- Stripe payment integration
- Subscription management
- Plan creation and management
- Payment processing

📧 **Email Services**
- Email verification on signup
- Password reset emails
- Test (Ethereal) and production (Gmail/SMTP) support
- HTML email templates

🏋️ **Fitness Plans**
- Gym plan creation and management
- Plan seeding system
- Plan assignment to users

📰 **News & Content**
- News management endpoints
- Content distribution system

🔐 **Admin Features**
- Admin role-based access control
- Admin user management
- Middleware for protecting admin routes
- Admin authentication

🛡️ **Security**
- JWT token authentication
- Password hashing with bcryptjs
- CORS protection
- Environment variable configuration
- Role-based authorization (RBAC)

## Tech Stack

- **Backend Framework:** Express.js 5.2
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JWT (jsonwebtoken), bcryptjs
- **Email Service:** Nodemailer (Ethereal test, SMTP, Gmail)
- **Payment Processing:** Stripe
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

# Email Configuration (Optional - for real SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key

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
| `SMTP_HOST` | ❌ No | SMTP server address (leave empty to use Ethereal test) |
| `SMTP_PORT` | ❌ No | SMTP port (usually 587 for TLS, 465 for SSL) |
| `SMTP_USER` | ❌ No | SMTP username/email |
| `SMTP_PASS` | ❌ No | SMTP password or app-specific password |
| `STRIPE_SECRET_KEY` | ❌ No | Stripe secret key for backend |
| `STRIPE_PUBLISHABLE_KEY` | ❌ No | Stripe publishable key |
| `NODE_ENV` | ❌ No | Environment (development/production) |
| `PORT` | ❌ No | Server port (default: 3000) |

### Email Configuration

**Option 1: Test Mode (Development)**
- Leave `SMTP_USER` and `SMTP_PASS` empty
- Emails will be sent through Ethereal Email (fake SMTP)
- Check preview URL in console logs

**Option 2: Production (Gmail)**
- Use Gmail SMTP: `smtp.gmail.com`
- Generate [App Password](https://myaccount.google.com/apppasswords)
- Use app password in `SMTP_PASS`

## Project Structure

```
gymbro-backend/
├── models/                  # Mongoose schemas
│   ├── User.js             # User model with auth & subscription fields
│   ├── Admin.js            # Admin model
│   └── Plan.js             # Fitness plan/subscription model
├── routes/                 # API route handlers
│   ├── userRoutes.js       # User endpoints (signup, login, profile)
│   ├── authRoutes.js       # Authentication endpoints
│   ├── adminRoutes.js      # Admin endpoints
│   ├── newsRoutes.js       # News management
│   ├── planRoutes.js       # Fitness plans
│   └── paymentRoutes.js    # Payment/Stripe endpoints
├── middleware/             # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── adminAuth.js        # Admin authorization
│   └── requireAdmin.js     # Admin role checks
├── controllers/            # Business logic
├── utils/                  # Utility functions
│   └── emailService.js     # Email sending (verification, reset)
├── scripts/                # Database scripts
│   └── seedPlans.js        # Seed default plans
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (git ignored)
└── README.md              # This file
```

## API Endpoints

### Authentication & User Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/users/signup` | Register new user | ❌ |
| `POST` | `/api/users/login` | Login user | ❌ |
| `GET` | `/api/users/verify-email/:token` | Verify email address | ❌ |
| `POST` | `/api/users/forgot-password` | Request password reset | ❌ |
| `POST` | `/api/users/reset-password` | Reset password with token | ❌ |
| `GET` | `/api/users/profile` | Get user profile | ✅ |
| `PUT` | `/api/users/profile` | Update user profile | ✅ |

### Plans Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/plans` | Get all plans | ❌ |
| `GET` | `/api/plans/:id` | Get plan details | ❌ |
| `POST` | `/api/plans` | Create plan | ✅ Admin |
| `PUT` | `/api/plans/:id` | Update plan | ✅ Admin |
| `DELETE` | `/api/plans/:id` | Delete plan | ✅ Admin |

### Payment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/create-intent` | Create Stripe payment intent | ✅ |
| `POST` | `/api/payments/confirm` | Confirm payment | ✅ |
| `GET` | `/api/payments/history` | Get payment history | ✅ |
| `GET` | `/api/payments/:id` | Get payment details | ✅ |

### News Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/news` | Get all news | ❌ |
| `GET` | `/api/news/:id` | Get news details | ❌ |
| `POST` | `/api/news` | Create news | ✅ Admin |
| `PUT` | `/api/news/:id` | Update news | ✅ Admin |
| `DELETE` | `/api/news/:id` | Delete news | ✅ Admin |

### Admin Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/admin/login` | Admin login | ❌ |
| `GET` | `/api/admin/users` | List all users | ✅ Admin |
| `GET` | `/api/admin/users/:id` | Get user details | ✅ Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user | ✅ Admin |
| `PUT` | `/api/admin/users/:id` | Update user | ✅ Admin |

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

Update your `.env` file with your MongoDB URI, JWT secret, and optional email/payment configs:

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/gymbro
JWT_SECRET=$(openssl rand -base64 32)
```

### 3. Setup Email Service (Optional)

**Development (Test Mode):**
- Leave `SMTP_USER` and `SMTP_PASS` empty
- Emails will use Ethereal (fake SMTP for testing)
- Preview URLs printed to console

**Production (Gmail SMTP):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
[Generate Gmail App Password](https://myaccount.google.com/apppasswords)

### 4. Setup Stripe (Optional)

1. Create account at [stripe.com](https://stripe.com)
2. Get your API keys from dashboard
3. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 5. Create Default Admin (Optional)

Set in `.env`:
```env
CREATE_DEFAULT_ADMIN=true
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=ChangeMe123!
```

Or use the admin creation script:
```bash
npm run create-admin
```

### 6. Seed Plans (Optional)

Load default fitness plans:
```bash
npm run seed:plans
```

### 7. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Create new admin user (interactive)
npm run create-admin

# Seed database with default plans
npm run seed:plans

# Run tests
npm test
```

## Authentication Flow

### User Signup & Email Verification
1. User registers with email and password at `/api/users/signup`
2. Password hashed with bcryptjs
3. Verification email sent with token (valid 24 hours)
4. User clicks link in email to verify
5. Account activated after verification

### User Login
1. User sends credentials to `/api/users/login`
2. Server validates password
3. JWT token returned
4. Token included in `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Password Reset Flow
1. User requests reset at `/api/users/forgot-password`
2. Reset email sent with token (valid 1 hour)
3. User clicks link and submits new password
4. Password updated and verified

### Admin Access
- Admins use same JWT flow as users
- Additional `admin` role in JWT payload
- `requireAdmin` middleware verifies admin status
- Some routes require both authentication AND admin status

## Security Best Practices

- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ JWT tokens for stateless authentication
- ✅ CORS enabled for cross-origin requests
- ✅ Environment variables for sensitive data (never commit `.env`)
- ✅ Role-based access control (RBAC) - Admin & User roles
- ✅ Email verification for user accounts
- ✅ Secure password reset flow with token expiration
- ✅ Stripe PCI compliance for payment processing
- ⚠️ **TODO:** Rate limiting (consider `express-rate-limit`)
- ⚠️ **TODO:** Input validation (consider `joi` or `zod`)
- ⚠️ **TODO:** API request logging and monitoring

### Email Security Notes

- Never commit SMTP credentials to version control
- Use environment variables for all email authentication
- In production, use dedicated SMTP service (Gmail, SendGrid, AWS SES)
- Email tokens expire after set duration (24h for verification, 1h for password reset)

### Payment Security

- Never log or store full credit card information
- Use Stripe for PCI compliance
- Always validate payments on backend
- Store only Stripe payment IDs in database

## Troubleshooting

### MongoDB Connection Error
```
❌ DB connect error: MongooseError
```
- Check your `MONGO_URI` in `.env`
- Verify MongoDB is running (local) or your IP is whitelisted (Atlas)
- Check database user credentials
- Ensure connection string format is correct

### JWT_SECRET Error
```
❌ JWT_SECRET is not defined in environment variables
```
- Ensure `.env` file exists in root directory
- Add `JWT_SECRET` to `.env`
- Restart the server

### Email Not Sending
```
❌ Email send error: [error message]
```
- **Development:** Check for Ethereal preview URL in console logs
- **Production:** Verify SMTP credentials are correct
- Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- For Gmail: Use [App Password](https://myaccount.google.com/apppasswords), not account password
- Check email provider's firewall/security settings

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change `PORT` in `.env` to different port
- Or kill process using port 3000:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -i :3000` then `kill -9 <PID>`

### Plans Seed Not Working
```
Error: Plans collection already exists / No plans created
```
- Clear the plans collection: `db.plans.deleteMany({})`
- Run seed script: `npm run seed:plans`
- Check MongoDB connection before seeding

### Stripe Payment Errors
```
❌ Stripe API Error
```
- Verify `STRIPE_SECRET_KEY` is set correctly in `.env`
- Check you're using correct key (test vs live)
- Verify Stripe account is active
- Check request payload format matches Stripe expectations

## Database Models

### User Model
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  isVerified: Boolean,
  verificationToken: String,
  verificationTokenExpiry: Date,
  currentPlan: ObjectId (ref: Plan),
  subscription: {
    status: String (active/inactive),
    startDate: Date,
    endDate: Date,
    stripePaymentId: String
  }
}
```

### Plan Model
```javascript
{
  name: String,
  description: String,
  duration: Number (days),
  price: Number,
  features: [String],
  level: String (beginner/intermediate/advanced)
}
```

### Admin Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (admin),
  createdAt: Date
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

Found a bug? Have a suggestion? [Open an issue](https://github.com/yourusername/gymbro-backend/issues) on GitHub.

## Contact

- **Email:** support@gymbro.app
- **GitHub Issues:** [Report Issues](https://github.com/yourusername/gymbro-backend/issues)

---

Made with ❤️ for fitness enthusiasts | GymBro Backend © 2026
