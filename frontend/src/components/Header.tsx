import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="ml-2 text-xl font-bold text-primary-600">ReMedGo</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </div>

          {/* Right side buttons and links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              // Not logged in
              <>
                {/* For Pharmacists link */}
                <Link 
                  to="/pharmacist-login" 
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  For Pharmacists
                </Link>

                {/* Login button */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Log In
                </Link>

                {/* Sign Up button */}
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 