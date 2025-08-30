import React, { useState, useEffect } from 'react';
import { Medicine } from '../../types';
import apiService from '../../services/api';

interface MedicineFormProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    dosageForm: '',
    strength: '',
    description: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        description: medicine.description || '',
        isActive: medicine.isActive
      });
    } else {
      setFormData({
        name: '',
        manufacturer: '',
        dosageForm: '',
        strength: '',
        description: '',
        isActive: true
      });
    }
    setErrors({});
  }, [medicine]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.dosageForm.trim()) {
      newErrors.dosageForm = 'Dosage form is required';
    }

    if (!formData.strength.trim()) {
      newErrors.strength = 'Strength is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (medicine) {
        await apiService.updateMedicine(medicine.id, formData);
      } else {
        await apiService.createMedicine(formData);
      }
      onSubmit();
    } catch (error) {
      console.error('Failed to save medicine:', error);
      setErrors({ submit: 'Failed to save medicine. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Medicine Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Paracetamol"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Manufacturer */}
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Pfizer"
              />
              {errors.manufacturer && <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>}
            </div>

            {/* Dosage Form */}
            <div>
              <label htmlFor="dosageForm" className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Form *
              </label>
              <select
                id="dosageForm"
                value={formData.dosageForm}
                onChange={(e) => handleInputChange('dosageForm', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dosageForm ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select dosage form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Drops</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Suspension">Suspension</option>
                <option value="Other">Other</option>
              </select>
              {errors.dosageForm && <p className="mt-1 text-sm text-red-600">{errors.dosageForm}</p>}
            </div>

            {/* Strength */}
            <div>
              <label htmlFor="strength" className="block text-sm font-medium text-gray-700 mb-1">
                Strength *
              </label>
              <input
                type="text"
                id="strength"
                value={formData.strength}
                onChange={(e) => handleInputChange('strength', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.strength ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 500mg"
              />
              {errors.strength && <p className="mt-1 text-sm text-red-600">{errors.strength}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description of the medicine..."
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Active Medicine</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Inactive medicines won't appear in the catalog for pharmacists
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                medicine ? 'Update Medicine' : 'Add Medicine'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm; 