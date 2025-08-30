import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    role: 'PATIENT',
    phone: '',
    licenseNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Name must contain only alphabetic characters';
        }
        return '';
      
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address (e.g., user@domain.com)';
        }
        return '';
      
      case 'password':
        if (!value) {
          return 'Password is required';
        }
        if (value.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        // Password strength validation
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        if (!hasUpperCase) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumbers) {
          return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
          return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
        }
        return '';
      
      case 'phone':
        if (!value.trim()) {
          return 'Phone number is required';
        }
        const cleanPhone = value.replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanPhone)) {
          return 'Phone number must be exactly 10 digits';
        }
        return '';
      
      case 'licenseNumber':
        if (formData.role === 'PHARMACIST') {
          if (!value || !value.trim()) {
            return 'License number is required for pharmacists';
          }
          if (value.trim().length < 3) {
            return 'License number must be at least 3 characters long';
          }
        }
        return '';
      
      case 'role':
        if (!value) {
          return 'Please select a role';
        }
        if (!['PATIENT', 'PHARMACIST'].includes(value)) {
          return 'Please select a valid role';
        }
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof RegisterData;
      const value = formData[fieldName];
      if (value !== undefined) {
        const error = validateField(fieldName, value);
        if (error && error.trim() !== '') {
          newErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Only validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => {
        const next = { ...prev } as Record<string, string>;
        if (error && error.trim() !== '') {
          next[name] = error;
        } else {
          delete next[name];
        }
        return next;
      });
    }

    // Clear license number error when role changes from PHARMACIST to PATIENT
    if (name === 'role' && value === 'PATIENT' && errors.licenseNumber) {
      setErrors(prev => ({
        ...prev,
        licenseNumber: ''
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field
    const error = validateField(name, value);
    setErrors(prev => {
      const next = { ...prev } as Record<string, string>;
      if (error && error.trim() !== '') {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSuccess('');

    // Mark all fields as touched when submitting
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting registration with data:', formData);
      await register(formData);
      console.log('Registration successful');
      setSuccess('Registration successful! Please sign in.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    // Compute current validation errors from form values (not from errors state)
    const currentErrors: Record<string, string> = {};
    const fieldsToValidate: Array<keyof RegisterData> = ['name', 'email', 'password', 'role', 'phone'];
    fieldsToValidate.forEach((field) => {
      const value = String(formData[field] ?? '');
      const msg = validateField(field as string, value);
      if (msg) currentErrors[field as string] = msg;
    });
    if (formData.role === 'PHARMACIST') {
      const msg = validateField('licenseNumber', formData.licenseNumber || '');
      if (msg) currentErrors['licenseNumber'] = msg;
    }

    const hasNoErrors = Object.keys(currentErrors).length === 0;
    return hasNoErrors && termsAccepted;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-20 animate-bounce">
        <div className="w-8 h-8 bg-primary-600 rounded-full opacity-20"></div>
      </div>
      <div className="absolute bottom-20 right-20 animate-pulse">
        <div className="w-6 h-6 bg-purple-600 rounded-full opacity-30"></div>
      </div>
      <div className="absolute top-1/2 right-10 animate-ping">
        <div className="w-4 h-4 bg-pink-600 rounded-full opacity-40"></div>
      </div>

      <div className={`relative z-10 w-full max-w-lg transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Join ReMedGo
          </h1>
          <p className="text-gray-600 text-lg">
            Create your account and start managing your prescriptions
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group md:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 ${
                      touched.name && errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                {touched.name && errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 ${
                      touched.email && errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 ${
                      touched.phone && errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                {touched.phone && errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 pr-12 ${
                      touched.password && errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {touched.password && formData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        One uppercase letter
                      </div>
                      <div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        One lowercase letter
                      </div>
                      <div className={`flex items-center text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        One number
                      </div>
                      <div className={`flex items-center text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="group">
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="PHARMACIST">Pharmacist</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {formData.role === 'PHARMACIST' && (
                <div className="group md:col-span-2">
                  <label htmlFor="licenseNumber" className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
                    License Number
                  </label>
                  <div className="relative">
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required={formData.role === 'PHARMACIST'}
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 ${
                        touched.licenseNumber && errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your license number"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  {touched.licenseNumber && errors.licenseNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                  )}
                </div>
              )}
            </div>

                                                   <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                            termsAccepted 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-orange-300 bg-orange-50'
                          }`}>
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" 
                  required
                />
                <span className={`ml-2 text-sm font-medium ${
                  termsAccepted ? 'text-green-700' : 'text-orange-700'
                }`}>
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium transition-colors underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium transition-colors underline">
                    Privacy Policy
                  </Link>
                  {!termsAccepted && (
                    <span className="block text-xs mt-1 text-orange-600">
                      ⚠️ You must accept the terms to create an account
                    </span>
                  )}
                </span>
              </div>

                                       {/* Debug info - remove this in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                  <strong>Debug:</strong> Button enabled: {isFormValid() ? 'Yes' : 'No'} | 
                  Terms: {termsAccepted ? 'Yes' : 'No'} | 
                  Has Required Fields: {(formData.name.trim() && formData.email.trim() && formData.password.length >= 8 && formData.phone?.trim()) ? 'Yes' : 'No'} | 
                  Has Role Specific Fields: {(formData.role !== 'PHARMACIST' || (formData.role === 'PHARMACIST' && formData.licenseNumber?.trim())) ? 'Yes' : 'No'} | 
                  Has No Errors: {Object.keys(errors).length === 0 ? 'Yes' : 'No'} | 
                  Name: {formData.name.trim() ? '✓' : '✗'} | 
                  Email: {formData.email.trim() ? '✓' : '✗'} | 
                  Phone: {formData.phone?.trim() ? '✓' : '✗'} | 
                  Password: {formData.password.length >= 8 ? '✓' : '✗'} | 
                  Role: {formData.role || '✗'} | 
                  License: {formData.role === 'PHARMACIST' ? (formData.licenseNumber?.trim() ? '✓' : '✗') : 'N/A'}
                  {Object.keys(errors).length > 0 && (
                    <div className="mt-1 text-red-600">
                      <strong>Errors:</strong> {JSON.stringify(errors)}
                    </div>
                  )}
                </div>
              )}
             
                           {/* Help text for disabled button */}
              {!isFormValid() && !isLoading && (
                <div className="text-sm text-orange-600 mb-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      {Object.keys(errors).length > 0 ? (
                        <div>
                          <strong>Please fix the following errors:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {Object.entries(errors).map(([field, error]) => (
                              <li key={field}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <strong>Please complete the following:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {!formData.name.trim() && <li>Enter your full name</li>}
                            {!formData.email.trim() && <li>Enter your email address</li>}
                            {!formData.phone?.trim() && <li>Enter your phone number</li>}
                            {formData.password.length < 8 && <li>Password must be at least 8 characters</li>}
                            {formData.role === 'PHARMACIST' && !formData.licenseNumber?.trim() && <li>Enter your license number</li>}
                            {!termsAccepted && <li>Accept the terms of service</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                title={!isFormValid() ? 'Please fill all required fields and accept terms' : ''}
              >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Your data is protected with bank-level security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 