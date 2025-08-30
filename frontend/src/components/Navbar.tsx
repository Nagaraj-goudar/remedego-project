import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">ReMedGo</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-3">
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 