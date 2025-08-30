import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Profile: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      
      // Handle role-specific fields
      if (user.role === 'PATIENT') {
        const patient = user as any;
        setAddress(patient.address || '');
        setDateOfBirth(patient.dateOfBirth || '');
      }
      if (user.role === 'PHARMACIST') {
        const pharmacist = user as any;
        setLicenseNumber(pharmacist.licenseNumber || '');
      }
    }
    // trigger mount animation
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = { name, phone };
      
      // Add role-specific fields
      if (user?.role === 'PATIENT') {
        payload.address = address;
        payload.dateOfBirth = dateOfBirth;
      }
      if (user?.role === 'PHARMACIST') {
        payload.licenseNumber = licenseNumber;
      }
      
      await apiService.updateCurrentUser(payload);
      setMessage('Profile updated successfully');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        return;
      }
      
      // Validate file size (1MB)
      if (file.size > 1024 * 1024) {
        setMessage('File size must be less than 1MB');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    
    setUploadingPhoto(true);
    setMessage(null);
    
    try {
      const filename = await apiService.uploadProfilePhoto(selectedFile);
      setMessage('Profile photo uploaded successfully');
      
      // Update the user context with new photo
      if (user) {
        const updatedUser = { ...user, profilePhoto: filename };
        // You might want to update the auth context here
      }
      
      // Clear the selected file and preview
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long');
      return;
    }
    
    setUpdatingPassword(true);
    setMessage(null);
    
    try {
      await apiService.updatePassword(oldPassword, newPassword);
      setMessage('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getProfilePhotoUrl = () => {
    if (previewUrl) return previewUrl;
    if (user?.profilePhoto) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/files/uploads/${user.profilePhoto}`;
    }
    return null;
  };

  const backPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'PHARMACIST' ? '/pharmacist' : '/patient';

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => navigate(backPath)}
              className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center ring-4 ring-primary-200 overflow-hidden">
                  {user?.profilePhoto ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/files/uploads/${user.profilePhoto}`}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-700 font-bold text-2xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-3">👤</span>
                    <span>Profile</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'password'
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-3">🔒</span>
                    <span>Change Password</span>
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-8">
            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}
            
            {activeTab === 'profile' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
                
                {/* Profile Picture Section */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {getProfilePhotoUrl() ? (
                        <img 
                          src={getProfilePhotoUrl()!} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <label
                      htmlFor="profile-photo"
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </label>
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Select Your Picture</p>
                  <p className="text-xs text-gray-500">Accepted Image Files: JPEG, JPG, PNG</p>
                  <p className="text-xs text-gray-500">Accepted Size: 300 x 300 (1MB)</p>
                  
                  {selectedFile && (
                    <div className="mt-3">
                      <button
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="ml-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Form */}
                <form onSubmit={onSubmit} className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={name.split(' ')[0] || ''}
                        onChange={(e) => setName(e.target.value + ' ' + (name.split(' ').slice(1).join(' ') || ''))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={name.split(' ').slice(1).join(' ') || ''}
                        onChange={(e) => setName((name.split(' ')[0] || '') + ' ' + e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Phone Number"
                    />
                  </div>

                  {/* Role-specific fields */}
                  {user?.role === 'PATIENT' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </>
                  )}

                  {user?.role === 'PHARMACIST' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="License Number"
                      />
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Profile Now'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Password</h2>
                
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Old Password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="New Password"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Confirm New Password"
                      required
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingPassword ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


