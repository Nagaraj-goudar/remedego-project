import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardPath = user?.role === 'ADMIN'
    ? '/admin'
    : user?.role === 'PHARMACIST'
    ? '/pharmacist'
    : '/patient';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center ring-1 ring-primary-200">
          <span className="text-primary-700 font-semibold">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in-up">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="py-2">
            <Link
              to={dashboardPath}
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setOpen(false)}
            >
              <span className="mr-3">🏠</span>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setOpen(false)}
            >
              <span className="mr-3">⚙️</span>
              <span>Profile Settings</span>
            </Link>
            <Link
              to="/help"
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setOpen(false)}
            >
              <span className="mr-3">❓</span>
              <span>Help Support</span>
            </Link>
          </div>

          <div className="border-t border-gray-100" />

          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition rounded-b-xl"
          >
            <span className="mr-3">↩️</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
