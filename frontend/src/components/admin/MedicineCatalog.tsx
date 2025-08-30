import React, { useState, useEffect } from 'react';
import { Medicine } from '../../types';
import apiService from '../../services/api';
import { toast } from 'react-toastify';
// Temporarily using text instead of icons due to import issues

interface MedicineCatalogProps {
  medicines: Medicine[];
  onMedicineUpdate: () => void;
}

const MedicineCatalog: React.FC<MedicineCatalogProps> = ({ medicines, onMedicineUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>(medicines);

  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    dosageForm: '',
    strength: '',
    description: '',
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const dosageFormOptions = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Cream', 'Gel', 'Suspension', 'Powder'
  ];

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchTerm]);

  const filterMedicines = () => {
    const filtered = medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (selectedMedicine) {
        await apiService.updateMedicine(selectedMedicine.id, formData);
        toast.success('Medicine updated successfully');
      } else {
        await apiService.createMedicine(formData);
        toast.success('Medicine added successfully');
      }
      onMedicineUpdate();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      dosageForm: medicine.dosageForm,
      strength: medicine.strength,
      description: medicine.description || '',
      isActive: medicine.isActive
    });
    setShowEditModal(true);
  };

  const handleDelete = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedMedicine) return;

    setLoading(true);
    try {
      await apiService.deleteMedicine(selectedMedicine.id);
      toast.success('Medicine deleted successfully');
      onMedicineUpdate();
      setShowDeleteModal(false);
      setSelectedMedicine(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedMedicine(null);
    setFormData({
      name: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
      description: '',
      isActive: true
    });
    setErrors({});
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
      description: '',
      isActive: true
    });
    setErrors({});
    setShowAddModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Medicine Catalog</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            ➕ Add Medicine
          </button>
        </div>
      </div>

        <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage Form</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                      {medicine.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{medicine.description}</div>
                      )}
                    </div>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.manufacturer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.dosageForm}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.strength}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    medicine.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {medicine.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                      <button
                       onClick={() => handleEdit(medicine)}
                       className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                       title="Edit"
                      >
                       ✏️
                      </button>
                      <button
                       onClick={() => handleDelete(medicine)}
                       className="text-red-600 hover:text-red-900 transition-colors duration-200"
                       title="Delete"
                      >
                       🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Add/Edit Medicine Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
                <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                >
                ×
                </button>
              </div>

            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                                 <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                   <span className="text-blue-500 text-xl">💊</span>
                   Basic Information
                 </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter medicine name (e.g., Paracetamol)"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer *
                    </label>
                                         <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-400 text-sm">🏭</span>
                       <input
                        type="text"
                        placeholder="Enter manufacturer name (e.g., Cipla)"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.manufacturer && <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage Form *
                    </label>
                                         <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-400 text-sm">💊</span>
                       <select
                        value={formData.dosageForm}
                        onChange={(e) => setFormData({...formData, dosageForm: e.target.value})}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.dosageForm ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select dosage form</option>
                        {dosageFormOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    {errors.dosageForm && <p className="text-red-500 text-sm mt-1">{errors.dosageForm}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strength *
                    </label>
                                         <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-400 text-sm">🧪</span>
                       <input
                        type="text"
                        placeholder="Enter strength (e.g., 500mg)"
                        value={formData.strength}
                        onChange={(e) => setFormData({...formData, strength: e.target.value})}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.strength ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.strength && <p className="text-red-500 text-sm mt-1">{errors.strength}</p>}
                  </div>
                </div>
          </div>

              {/* Details Section */}
              <div>
                                 <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                   <span className="text-green-500 text-xl">📄</span>
                   Details
                 </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Briefly describe the medicine and its use"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
      </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active (Available for use)
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
                  <p><strong>Manufacturer:</strong> {formData.manufacturer || 'Not specified'}</p>
                  <p><strong>Dosage Form:</strong> {formData.dosageForm || 'Not specified'}</p>
                  <p><strong>Strength:</strong> {formData.strength || 'Not specified'}</p>
                  <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (selectedMedicine ? 'Update Medicine' : 'Add Medicine')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Medicine</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedMedicine.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineCatalog; 