import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import HomePage from './pages/HomePage';
import PatientDashboard from './pages/PatientDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Landing page layout with Header and Footer
const LandingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/home" element={
        <LandingLayout>
          <HomePage />
        </LandingLayout>
      } />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout>
            <Profile />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          user ? (
            <PrivateRoute>
              {user?.role === 'ADMIN' ? (
                <AdminDashboard />
              ) : user?.role === 'PATIENT' ? (
                <Layout>
                  <PatientDashboard />
                </Layout>
              ) : (
                <Layout>
                  <PharmacistDashboard />
                </Layout>
              )}
            </PrivateRoute>
          ) : (
            <Navigate to="/home" replace />
          )
        } 
      />
      <Route 
        path="/patient/*" 
        element={
          <PrivateRoute allowedRoles={['PATIENT']}>
            <Layout>
              <PatientDashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/pharmacist/*" 
        element={
          <PrivateRoute allowedRoles={['PHARMACIST']}>
            <Layout>
              <PharmacistDashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
};

export default App; 