import React, { useState } from 'react';
import apiService from '../services/api';

interface ReminderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggleReminders = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.updateReminderSettings(!isEnabled);
      setIsEnabled(!isEnabled);
      setMessage(response.message || 'Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">📧 Email Reminder Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">How Email Reminders Work</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You'll receive an email when medicines are filled</li>
              <li>• You'll get an email reminder 3 days before medicines run out</li>
              <li>• You'll be notified by email when medicines are dispatched</li>
              <li>• Refill reminders are sent only if the filled medicines last 7 days or more</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Email Reminders</h3>
              <p className="text-sm text-gray-600">
                {isEnabled ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
            <button
              onClick={handleToggleReminders}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Updating...' : isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Privacy & Security</h3>
            <p className="text-sm text-gray-600">
              Your email is only used for medication reminders and will never be shared with third parties. 
              You can disable reminders at any time.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
