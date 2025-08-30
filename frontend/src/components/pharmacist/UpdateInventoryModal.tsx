import React, { useState, useEffect } from 'react';
import { Inventory } from '../../types';
import apiService from '../../services/api';

interface UpdateInventoryModalProps {
  inventory: Inventory;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const UpdateInventoryModal: React.FC<UpdateInventoryModalProps> = ({ inventory, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    stockQuantity: '',
    lowStockThreshold: '',
    expiryDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (inventory) {
      setFormData({
        stockQuantity: inventory.stockQuantity.toString(),
        lowStockThreshold: inventory.lowStockThreshold.toString(),
        expiryDate: inventory.expiryDate || ''
      });
    }
  }, [inventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Stock quantity must be 0 or greater';
    }
    
    if (!formData.lowStockThreshold || parseInt(formData.lowStockThreshold) < 0) {
      newErrors.lowStockThreshold = 'Low stock threshold must be 0 or greater';
    }
    
    if (newErrors.stockQuantity || newErrors.lowStockThreshold) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateInventory(
        inventory.id,
        parseInt(formData.stockQuantity),
        parseInt(formData.lowStockThreshold),
        formData.expiryDate || undefined
      );
      onSubmit();
    } catch (error) {
      console.error('Failed to update inventory:', error);
      setErrors({ submit: 'Failed to update inventory. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !inventory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Update Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Medicine Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{inventory.medicineName}</h3>
            <p className="text-sm text-gray-600">
              {inventory.manufacturer} • {inventory.strength} • {inventory.dosageForm}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Stock Quantity */}
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 100"
                />
                {errors.stockQuantity && <p className="mt-1 text-sm text-red-600">{errors.stockQuantity}</p>}
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold *
                </label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lowStockThreshold ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 10"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Alert will be shown when stock falls below this number
                </p>
                {errors.lowStockThreshold && <p className="mt-1 text-sm text-red-600">{errors.lowStockThreshold}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Set expiry date for batch tracking
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
                    Updating...
                  </div>
                ) : (
                  'Update Inventory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateInventoryModal; 