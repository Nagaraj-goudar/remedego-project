import React, { useState, useEffect } from 'react';

export interface AddressFormValues {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface AddressFormProps {
  initial?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  onCancel: () => void;
  title?: string;
  submitText?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ initial, onSubmit, onCancel, title = 'Delivery Address', submitText = 'Save Address' }) => {
  const [values, setValues] = useState<AddressFormValues>({
    line1: initial?.line1 || '',
    line2: initial?.line2 || '',
    city: initial?.city || '',
    state: initial?.state || '',
    pincode: initial?.pincode || '',
    phone: initial?.phone || ''
  });
  const [errors, setErrors] = useState<{[k: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');

  const validate = (): boolean => {
    const e: {[k: string]: string} = {};
    if (!values.line1.trim()) e.line1 = 'Address Line 1 is required';
    if (!values.city.trim()) e.city = 'City is required';
    if (!values.state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(values.pincode)) e.pincode = 'Pincode must be 6 digits';
    if (!/^\d{10}$/.test(values.phone)) e.phone = 'Phone must be 10 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof AddressFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(v => ({ ...v, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSubmit({ ...values, line1: values.line1.trim(), line2: values.line2?.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header with gradient */}
        {title && (
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in-up">
              {title}
            </h3>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-2 rounded-full animate-scale-in"></div>
          </div>
        )}

        {/* Address Line 1 */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Address Line 1 *
          </label>
          <div className="relative">
            <input 
              value={values.line1} 
              onChange={handleChange('line1')}
              onFocus={() => setFocusedField('line1')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
                focusedField === 'line1' ? 'border-blue-500 shadow-lg' : 'border-gray-300'
              } ${errors.line1 ? 'border-red-500 focus:ring-red-100' : ''}`}
              placeholder="Enter your street address"
            />
            {focusedField === 'line1' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          {errors.line1 && (
            <div className="text-red-600 text-sm mt-2 flex items-center animate-fade-in-up">
              <span className="mr-1">⚠️</span>
              {errors.line1}
            </div>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Address Line 2 (Optional)
          </label>
          <input 
            value={values.line2} 
            onChange={handleChange('line2')}
            onFocus={() => setFocusedField('line2')}
            onBlur={() => setFocusedField('')}
            className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
              focusedField === 'line2' ? 'border-blue-500 shadow-lg' : 'border-gray-300'
            }`}
            placeholder="Apartment, suite, etc. (optional)"
          />
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              City *
            </label>
            <input 
              value={values.city} 
              onChange={handleChange('city')}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 ${
                focusedField === 'city' ? 'border-green-500 shadow-lg' : 'border-gray-300'
              } ${errors.city ? 'border-red-500 focus:ring-red-100' : ''}`}
              placeholder="Enter city name"
            />
            {errors.city && (
              <div className="text-red-600 text-sm mt-2 flex items-center animate-fade-in-up">
                <span className="mr-1">⚠️</span>
                {errors.city}
              </div>
            )}
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              State *
            </label>
            <input 
              value={values.state} 
              onChange={handleChange('state')}
              onFocus={() => setFocusedField('state')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 ${
                focusedField === 'state' ? 'border-green-500 shadow-lg' : 'border-gray-300'
              } ${errors.state ? 'border-red-500 focus:ring-red-100' : ''}`}
              placeholder="Enter state name"
            />
            {errors.state && (
              <div className="text-red-600 text-sm mt-2 flex items-center animate-fade-in-up">
                <span className="mr-1">⚠️</span>
                {errors.state}
              </div>
            )}
          </div>
        </div>

        {/* Pincode and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Pincode *
            </label>
            <input 
              value={values.pincode} 
              onChange={handleChange('pincode')}
              onFocus={() => setFocusedField('pincode')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 ${
                focusedField === 'pincode' ? 'border-purple-500 shadow-lg' : 'border-gray-300'
              } ${errors.pincode ? 'border-red-500 focus:ring-red-100' : ''}`}
              placeholder="6-digit pincode"
              maxLength={6}
            />
            {errors.pincode && (
              <div className="text-red-600 text-sm mt-2 flex items-center animate-fade-in-up">
                <span className="mr-1">⚠️</span>
                {errors.pincode}
              </div>
            )}
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Phone Number *
            </label>
            <input 
              value={values.phone} 
              onChange={handleChange('phone')}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField('')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-300 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 ${
                focusedField === 'phone' ? 'border-purple-500 shadow-lg' : 'border-gray-300'
              } ${errors.phone ? 'border-red-500 focus:ring-red-100' : ''}`}
              placeholder="10-digit phone number"
              maxLength={10}
            />
            {errors.phone && (
              <div className="text-red-600 text-sm mt-2 flex items-center animate-fade-in-up">
                <span className="mr-1">⚠️</span>
                {errors.phone}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 hover:shadow-md hover-lift"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover-lift disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <span className="mr-2">📦</span>
                {submitText}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;


