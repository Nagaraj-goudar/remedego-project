# Online Pharmacy Frontend

This is the frontend application for the Online Pharmacy web application built with React, TypeScript, and Tailwind CSS.

## Features Implemented

### Must-Have Features (P-01, PH-01, P-02, PH-02, P-03, PH-03)
- ✅ Patient Registration & Login
- ✅ Pharmacist Registration & Login  
- ✅ Prescription Upload (with file validation)
- ✅ Prescription Management (view and update status)
- ✅ Order Status Viewing (real-time status display)
- ✅ Order Status Management (update order status)

### Should-Have Features (P-04, PH-04, PH-05, N-01)
- ✅ Refill Request (UI ready, backend integration pending)
- ✅ Refill Request Management (UI ready, backend integration pending)
- ✅ Inventory Management (UI ready, backend integration pending)
- ✅ SMS Notifications (backend integration pending)

## Tech Stack

- **React 18** with TypeScript
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Context API** for state management

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── LoadingSpinner.tsx
│   ├── Navbar.tsx      # Navigation bar
│   ├── OrderStatus.tsx # Order status display
│   └── PrescriptionUpload.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── PatientDashboard.tsx
│   └── PharmacistDashboard.tsx
├── services/           # API services
│   └── api.ts         # HTTP client and API calls
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main app component
├── index.tsx          # Entry point
└── index.css          # Global styles with Tailwind
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

## Features Overview

### Authentication
- User registration with role selection (Patient/Pharmacist)
- Login with email and password
- JWT token-based authentication
- Protected routes based on user roles

### Patient Features
- Upload prescription images/PDFs
- View prescription status and history
- Track order status in real-time
- Request refills for previous orders

### Pharmacist Features
- Review and approve/reject prescriptions
- Update order status
- Manage inventory
- View pending refill requests

### UI/UX Design
- Responsive design for all screen sizes
- Clean, modern interface with Tailwind CSS
- Role-specific dashboards
- Loading states and error handling
- Form validation and user feedback

## API Integration

The frontend is designed to work with a Spring Boot backend API. All API calls are centralized in the `api.ts` service file with proper error handling and authentication.

## Next Steps

1. **Backend Development**: Implement the Spring Boot backend with all required endpoints
2. **Database Setup**: Set up MySQL database with proper schema
3. **File Upload**: Implement server-side file handling for prescriptions
4. **SMS Integration**: Add MSG91 integration for notifications
5. **Testing**: Add unit and integration tests
6. **Deployment**: Deploy to production environment

## Contributing

1. Follow the existing code style and structure
2. Add proper TypeScript types for all new features
3. Test thoroughly before submitting changes
4. Update documentation as needed 
