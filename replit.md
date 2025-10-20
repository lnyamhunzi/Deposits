# Q-Sight Regulatory System

**Comprehensive deposit insurance regulatory platform for Deposit Protection Corporation Zimbabwe**

## Project Overview

Q-Sight is an enterprise-grade regulatory system designed to help the Deposit Protection Corporation Zimbabwe manage deposit insurance operations including:

- **Returns Management**: Upload, validate, and approve deposit returns from financial institutions
- **Bank Surveillance**: Monitor financial health using CAMELS ratings and deposit analysis
- **Risk Analysis**: Conduct stress testing and risk scoring with early warning systems
- **Premiums Management**: Automated premium calculations, invoicing, and payment reconciliation
- **Single Customer View**: Consolidated customer deposit data across institutions
- **Reporting**: Generate regulatory reports and compliance documentation

## Recent Changes

### October 20, 2025
- ✅ Implemented complete database schema with all modules
- ✅ Built all frontend pages with professional UI based on Carbon Design System
- ✅ Created comprehensive backend API with PostgreSQL integration
- ✅ Set up authentication using Replit Auth
- ✅ Implemented sidebar navigation and routing
- ✅ Added seed data for testing with 6 sample institutions

## Architecture

### Technology Stack

**Frontend**:
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- Recharts for data visualization

**Backend**:
- Express.js API server
- PostgreSQL database (Neon)
- Drizzle ORM for type-safe database access
- Replit Auth for authentication

### Database Schema

The system uses a comprehensive PostgreSQL database with the following main tables:

- `users` - User accounts and roles
- `institutions` - Financial institutions being regulated
- `returns` - Deposit return submissions
- `deposits` - Deposit data from returns
- `camels_ratings` - CAMELS financial health ratings
- `stress_tests` - Stress test scenarios and results
- `risk_scores` - Risk assessment calculations
- `premiums` - Premium calculations
- `invoices` - Premium invoices
- `payments` - Payment records
- `penalties` - Penalty records
- `customers` - Single customer view data
- `audit_logs` - Audit trail

### Color Scheme

Professional blue color scheme for financial/regulatory applications:
- Primary: `hsl(210 65% 45%)` - Professional blue
- CAMELS Rating Colors:
  - Rating 1 (Strong): `hsl(142 71% 45%)` - Green
  - Rating 2 (Satisfactory): `hsl(160 50% 48%)` - Teal
  - Rating 3 (Fair): `hsl(45 93% 62%)` - Yellow
  - Rating 4 (Marginal): `hsl(28 80% 52%)` - Orange
  - Rating 5 (Unsatisfactory): `hsl(0 72% 51%)` - Red

## Project Structure

```
.
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components (Shadcn)
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── App.tsx        # Main application component
│   └── index.html
├── server/                # Backend Express API
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   ├── routes.ts         # API route handlers
│   ├── auth.ts           # Authentication logic
│   └── seed.ts           # Database seed data
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schema and types
└── design_guidelines.md  # UI/UX design specifications
```

## User Roles

- **Admin**: Full system access, can manage institutions and configure system
- **Analyst**: View all data, perform analysis, generate reports
- **Bank User**: Limited access to own institution's data

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get system-wide statistics

### Institutions
- `GET /api/institutions` - List all institutions
- `GET /api/institutions/:id` - Get institution details
- `POST /api/institutions` - Create new institution

### Returns Management
- `GET /api/returns` - List all returns
- `GET /api/returns/institution/:id` - Get returns for institution
- `POST /api/returns` - Submit new return
- `PATCH /api/returns/:id` - Update return status

### CAMELS Ratings
- `GET /api/camels` - List all ratings
- `GET /api/camels/:institutionId` - Get latest rating for institution
- `POST /api/camels` - Create new rating

### Stress Testing
- `GET /api/stress-tests` - List all stress tests
- `POST /api/stress-tests` - Run new stress test

### Premiums & Invoices
- `GET /api/premiums` - List all premiums
- `POST /api/premiums/calculate` - Calculate premiums for all institutions
- `GET /api/invoices` - List all invoices
- `GET /api/payments` - List all payments

### Customers
- `GET /api/customers` - List all customers (Single Customer View)

## Development

### Running the Application

```bash
npm run dev
```

The server will start on port 5000. Both backend and frontend are served from the same port.

### Database Operations

```bash
# Push schema changes to database
npm run db:push

# Force push (use if conflicts)
npm run db:push --force

# Seed database with test data
npx tsx server/seed.ts
```

### Environment Variables

All necessary environment variables are automatically configured:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- Other PostgreSQL credentials (PGUSER, PGPASSWORD, etc.)

## Key Features

### Returns Management
- File upload for deposit returns (Excel/CSV)
- Automated validation and control total checking
- Workflow: Pending → Validated → Approved/Rejected
- Penalty enforcement for late submissions

### Bank Surveillance
- Comprehensive CAMELS rating system:
  - **C**apital Adequacy
  - **A**sset Quality
  - **M**anagement Quality
  - **E**arnings
  - **L**iquidity
  - **S**ensitivity to Market Risk
- Deposit trend analysis
- Coverage calculations based on deposit insurance limits
- Early warning indicators

### Risk Analysis
- Stress Testing Scenarios:
  - Exchange Rate Shock
  - Liquidity Shock
  - Interest Rate Shock
  - Macroeconomic Downturn
  - Sectoral Shock
- Severity levels: Mild, Moderate, Severe
- CAMELS deterioration tracking
- Probability of Default (PD) calculation
- Anomaly detection

### Premiums Management
- Flat-rate and risk-based premium calculations
- Automated invoice generation
- Payment reconciliation
- Overdue payment tracking

### Single Customer View
- Consolidated customer deposit balances across institutions
- Insured vs uninsured amount calculations
- Account aggregation for trust and joint accounts
- Beneficiary tracking

### Reporting
- Monthly surveillance reports
- CAMELS summary reports
- Stress test results
- Premium reconciliation reports
- Compliance status reports

## User Preferences

### Design
- Clean, professional UI following Carbon Design System principles
- Data-dense layouts with clear information hierarchy
- Comprehensive data tables with sorting and filtering
- Interactive charts for trend analysis

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- Comprehensive error handling
- Audit logging for all critical operations

## Notes

- All timestamps are stored in UTC
- Financial amounts use decimal(20, 2) for precision
- JSON columns store complex nested data structures
- Audit logs capture all user actions for compliance
- The system supports multi-currency deposits
