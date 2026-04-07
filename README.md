# GymBro Backend

A modern, secure Node.js/Express backend API for a comprehensive gym management system. Built with MongoDB, JWT authentication, role-based access control, email services, and Stripe payment integration.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Express.js 5.2 |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT + bcryptjs |
| Email Service | Nodemailer (Ethereal, SMTP, Gmail) |
| Payment Processing | Stripe |
| Environment | Node.js v16+, dotenv |
| Development Tools | Nodemon |

## Key Features

**User Management**
- User registration and authentication with email verification
- Secure password hashing with bcryptjs
- JWT-based session management
- Automated password reset flow with token expiration
- User profile management and updates

**Financial Management**
- Stripe payment processing integration
- Subscription management and renewal handling
- Multiple fitness plan offerings
- Payment history tracking

**Communication**
- Email verification on user signup
- Automated password reset emails
- Support for test mode (Ethereal) and production (Gmail/SMTP)
- HTML email templates

**Content Management**
- Fitness plan creation and assignment
- Database seeding system for initial setup
- News and content distribution
- Plan versioning and updates

**Administration**
- Role-based access control (RBAC) with admin privileges
- Admin dashboard endpoints
- User management and moderation
- Dedicated admin authentication flow
- Protected admin-only routes via middleware

**Security**
- JWT token authentication with expiration
- Bcryptjs password hashing with 10 salt rounds
- CORS protection for API endpoints
- Environment-based configuration
- Rate limiting and request validation


## Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- MongoDB (local installation or Atlas cloud database)
- Stripe account (optional, for payment features)

## Quick Start

### 1. Install Dependencies

```bash
git clone https://github.com/yourusername/gymbro-backend.git
cd gymbro-backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add required configuration (see [Environment Variables](#environment-variables)):

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gymbro

# JWT
JWT_SECRET=your-super-secret-key

# Server
PORT=3000
NODE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Environment Variables

All environment variables should be defined in a `.env` file in the project root.

```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gymbro

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Admin Configuration (Optional)
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=ChangeMe123!
CREATE_DEFAULT_ADMIN=true

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Processing (Optional)
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Variable Reference

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

### Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB and start the service
mongod
```
Then use: `MONGO_URI=mongodb://localhost:27017/gymbro`

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and generate connection string
3. Add your IP to network access whitelist
4. Use the connection string as `MONGO_URI`

### Email Configuration

**Development (Test Mode)**
- Leave `SMTP_USER` and `SMTP_PASS` empty
- Emails will use Ethereal Email for testing
- Preview URLs will be logged to console

**Production (Gmail SMTP)**
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Payment Setup (Stripe)

1. Create a Stripe account at https://stripe.com
2. Get API keys from your dashboard
3. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

## Project Structure

```
gymbro-backend/
├── backend/
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js            # User authentication and profile
│   │   ├── Admin.js           # Admin user accounts
│   │   ├── Plan.js            # Fitness plans and subscriptions
│   │   ├── Exercise.js        # Exercise definitions
│   │   ├── Food.js            # Food and nutrition data
│   │   └── DailyData.js       # User daily tracking data
│   ├── routes/                # API route handlers
│   │   ├── userRoutes.js      # User endpoints (auth, profile)
│   │   ├── authRoutes.js      # Authentication endpoints
│   │   ├── adminRoutes.js     # Admin management endpoints
│   │   ├── planRoutes.js      # Fitness plan endpoints
│   │   ├── paymentRoutes.js   # Payment and Stripe endpoints
│   │   ├── foodRoutes.js      # Food database endpoints
│   │   ├── newsRoutes.js      # News and content endpoints
│   │   ├── dailyDataRoutes.js # User data tracking endpoints
│   │   └── aiCoachRoutes.js   # AI coaching endpoints
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT authentication verification
│   │   ├── adminAuth.js       # Admin role verification
│   │   ├── requireAdmin.js    # Admin access enforcement
│   │   ├── checkPremium.js    # Premium subscription check
│   │   ├── aiRateLimit.js     # AI feature rate limiting
│   │   ├── aiGuardrail.js     # AI safety and guardrails
│   │   └── rateLimiter.js     # General rate limiting
│   ├── controllers/           # Business logic layer
│   ├── utils/                 # Utility functions and services
│   │   ├── emailService.js    # Email sending and templates
│   │   ├── aiCoachService.js  # AI coaching via Groq API
│   │   └── monthlyReport.js   # Monthly report generation
│   ├── cron/                  # Background jobs
│   │   └── monthlyReportJob.js # Scheduled monthly reports
│   ├── scripts/               # Database and setup scripts
│   │   ├── seedPlans.js       # Load default fitness plans
│   │   ├── seedExercises.js   # Load exercise database
│   │   ├── seedFoods.js       # Load food database
│   │   ├── linkExercisesToPlans.js # Associate exercises with plans
│   │   ├── checkPlans.js      # Verify plan integrity
│   │   └── testDb.js          # Database connection testing
│   └── reports/               # Generated user reports (HTML)
├── server.js                  # Main application entry point
├── package.json               # Dependencies and scripts
├── .env                       # Environment variables (git ignored)
└── README.md                  # This file
```

## API Endpoints

### Authentication & User Management

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| POST | `/api/users/signup` | Register new user account | None |
| POST | `/api/users/login` | User login and session creation | None |
| GET | `/api/users/verify-email/:token` | Verify user email address | None |
| POST | `/api/users/forgot-password` | Request password reset | None |
| POST | `/api/users/reset-password` | Complete password reset | None |
| GET | `/api/users/profile` | Get authenticated user profile | Required |
| PUT | `/api/users/profile` | Update user profile information | Required |

### Plans Management

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| GET | `/api/plans` | Get all available fitness plans | None |
| GET | `/api/plans/:id` | Get specific plan details | None |
| POST | `/api/plans` | Create new fitness plan | Required (Admin) |
| PUT | `/api/plans/:id` | Update existing plan | Required (Admin) |
| DELETE | `/api/plans/:id` | Delete fitness plan | Required (Admin) |

### Payments & Subscriptions

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| POST | `/api/payments/create-intent` | Create Stripe payment intent | Required |
| POST | `/api/payments/confirm` | Confirm and process payment | Required |
| GET | `/api/payments/history` | Get user payment history | Required |
| GET | `/api/payments/:id` | Get payment details | Required |

### News & Content

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| GET | `/api/news` | Get all news articles | None |
| GET | `/api/news/:id` | Get specific news article | None |
| POST | `/api/news` | Create news article | Required (Admin) |
| PUT | `/api/news/:id` | Update news article | Required (Admin) |
| DELETE | `/api/news/:id` | Delete news article | Required (Admin) |

### Admin Operations

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| POST | `/api/admin/login` | Admin login | None |
| GET | `/api/admin/users` | List all users | Required (Admin) |
| GET | `/api/admin/users/:id` | Get specific user details | Required (Admin) |
| PUT | `/api/admin/users/:id` | Update user information | Required (Admin) |
| DELETE | `/api/admin/users/:id` | Remove user account | Required (Admin) |

### AI Coach Features

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| POST | `/api/ai-coach/advice` | Get AI fitness advice | Required |
| POST | `/api/ai-coach/meal-plan` | Generate AI meal plans | Required |

### Daily Data Tracking

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| GET | `/api/daily-data` | Get user daily tracking data | Required |
| POST | `/api/daily-data` | Record daily fitness/nutrition | Required |

### Food Database

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| GET | `/api/food` | Search food database | None |
| GET | `/api/food/:id` | Get food nutrition details | None |

## Development Commands

Available npm scripts for development and maintenance:

```bash
# Start development server with hot-reloading
npm run dev

# Start production server
npm start

# Create a new admin user (interactive)
npm run create-admin

# Seed database with default fitness plans
npm run seed:plans

# Seed database with exercises
npm run seed:exercises

# Seed database with food items
npm run seed:foods

# Link exercises to fitness plans
npm run link:exercises

# Run tests
npm test

# Check plan integrity
npm run check:plans
```

## Authentication & Security

### Authentication Flow

**User Registration & Email Verification**
1. User submits registration with email and password to `/api/users/signup`
2. Password is hashed using bcryptjs (10 salt rounds)
3. Verification email is sent with time-limited token (24 hours)
4. User clicks verification link in email
5. Account activated upon successful verification

**User Login**
1. User submits credentials to `/api/users/login`
2. Server validates email and password
3. JWT token issued and returned to client
4. Token must be included in `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

**Password Reset**
1. User initiates reset at `/api/users/forgot-password`
2. Reset link sent via email with time-limited token (1 hour)
3. User submits new password using reset link
4. Password updated after validation

**Admin Access**
- Admins authenticate using the same JWT flow as regular users
- Admin role embedded in JWT payload as `role: 'admin'`
- Protected routes use `requireAdmin` middleware to verify admin status
- Some endpoints require both authentication AND admin privileges

### Security Implementation

The following security measures are implemented:

- **Password Security:** Bcryptjs with 10 salt rounds (>100ms hashing)
- **Token Authentication:** Stateless JWT with configurable expiration
- **CORS Protection:** Configured CORS middleware on API endpoints
- **Configuration Safety:** All sensitive data via environment variables, never hardcoded
- **Authorization:** Role-based access control (User and Admin roles)
- **Email Verification:** Required verification before account activation
- **Token Expiration:** Time-limited tokens for password reset (1 hour) and email verification (24 hours)
- **Payment:** Stripe integration for PCI compliance

### Security Best Practices

**For Administrators:**
- Never commit `.env` files to version control
- Rotate JWT_SECRET regularly in production
- Use strong, unique JWT secrets (use `openssl rand -base64 32`)
- Enable 2-factor authentication on MongoDB Atlas and Stripe accounts
- Regularly audit admin user access and permissions

**For Email Configuration:**
- Never store SMTP passwords in code or logs
- Use app-specific passwords instead of account passwords (Gmail)
- Use TLS/SSL connections (port 587) for SMTP
- Consider dedicated SMTP services (SendGrid, AWS SES) for production

**For Payment Processing:**
- Never log or store full credit card information
- Use Stripe for all payment processing (PCI DSS compliant)
- Keep Stripe keys separate (secret on backend, public on frontend)
- Validate all payments on the backend before granting access

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
    status: String (active/inactive/expired),
    startDate: Date,
    endDate: Date,
    stripePaymentId: String,
    autoRenew: Boolean
  },
  createdAt: Date,
  updatedAt: Date
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
  level: String (beginner/intermediate/advanced),
  exercises: [ObjectId] (ref: Exercise),
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (admin),
  lastLogin: Date,
  createdAt: Date
}
```

## Troubleshooting

### MongoDB Connection Failed

**Error:** `DB connect error: MongooseError`

**Solutions:**
- Verify `MONGO_URI` is correct in `.env`
- Check MongoDB is running (local: `mongod` command)
- For Atlas: Ensure your IP is whitelisted in network access
- Verify database credentials are correct
- Test connection string separately: `mongo "your-connection-string"`

### Missing JWT Secret

**Error:** `JWT_SECRET is not defined in environment variables`

**Solutions:**
- Create `.env` file in project root directory
- Add valid `JWT_SECRET` variable
- Restart the server after updating `.env`
- To generate a secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Email Not Sending

**Error:** `Email send error: [error message]`

**Solutions:**
- **Development:** Check console for Ethereal preview URL
- **Production:** Verify email credentials in `.env`
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are set
- For Gmail: Use app-specific password, not account password
- Check email provider hasn't blocked your server IP
- Test email connectivity: `telnet smtp.gmail.com 587`

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
- Change `PORT` in `.env` to an available port
- Or kill the process using port 3000:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -i :3000` then `kill -9 <PID>`

### Database Seeding Issues

**Error:** `Error: Plans collection already exists` or `No plans created`

**Solutions:**
- Clear existing data: `db.plans.deleteMany({})`
- Verify MongoDB connection is active
- Run seed script: `npm run seed:plans`
- Check script output for specific errors

### Stripe Payment Errors

**Error:** `Stripe API Error / Invalid Request`

**Solutions:**
- Verify `STRIPE_SECRET_KEY` is valid and from your Stripe account
- Check you're using correct key (test vs live)
- Confirm Stripe account is active and in good standing
- Validate request payload matches Stripe expectations
- Check Stripe dashboard for API error logs

### Token Expiration Issues

**Error:** `Invalid JWT` or `Token Expired`

**Solutions:**
- Ensure client is sending valid token in `Authorization: Bearer` header
- Check server and client clocks are synchronized
- Generate new token by logging in again
- Verify `JWT_SECRET` matches on server

### CORS Issues

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions:**
- Verify CORS middleware is enabled in server setup
- Check allowed origins are configured correctly
- Ensure request includes proper headers
- Verify frontend origin matches CORS configuration

## Contributing

We welcome contributions to improve GymBro Backend. To contribute:

1. **Fork** the repository on GitHub
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with clear messages:
   ```bash
   git commit -m 'Add description of your feature'
   ```
4. **Push** to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create** a Pull Request with detailed description

### Contribution Guidelines

- Write clear, descriptive commit messages
- Test your code before submitting a PR
- Follow the existing code style and structure
- Update documentation for new features
- Ensure no hardcoded secrets or credentials

## License

Licensed under the ISC License. See LICENSE file for details.

## Support & Contact

**Found an issue?** Report it on GitHub Issues: https://github.com/yourusername/gymbro-backend/issues

**Have questions?** Contact us:
- Email: support@gymbro.app
- GitHub Issues: https://github.com/yourusername/gymbro-backend/issues

---

GymBro Backend 2026
