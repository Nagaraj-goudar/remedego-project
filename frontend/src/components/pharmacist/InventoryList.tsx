import React, { useState } from 'react';
import { Inventory, Medicine } from '../../types';
import apiService from '../../services/api';
import AddInventoryModal from './AddInventoryModal';
import UpdateInventoryModal from './UpdateInventoryModal';

interface InventoryListProps {
  inventory: Inventory[];
  medicines: Medicine[];
  onUpdate: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, medicines, onUpdate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const handleAddMedicine = () => {
    setIsAddModalOpen(true);
  };

  const handleEditInventory = (item: Inventory) => {
    setEditingInventory(item);
    setIsUpdateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setIsUpdateModalOpen(false);
    setEditingInventory(null);
  };

  const handleModalSubmit = async () => {
    await onUpdate();
    handleModalClose();
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your medicine stock and track inventory levels</p>
        </div>
        <button
          onClick={handleAddMedicine}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center animate-scale-in"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Medicine to Inventory
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Low Stock Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 animate-fade-in-up ${
                    item.isLowStock ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.medicineName}</div>
                      <div className="text-sm text-gray-500">
                        {item.manufacturer} • {item.strength} • {item.dosageForm}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.isLowStock ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.stockQuantity}
                      </span>
                      {item.isLowStock && (
                        <svg className="w-4 h-4 text-red-500 ml-2 soft-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.lowStockThreshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditInventory(item)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inventory.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding medicines to your inventory.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddMedicine}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Medicine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {isAddModalOpen && (
        <AddInventoryModal
          medicines={medicines}
          isOpen={isAddModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Update Inventory Modal */}
      {isUpdateModalOpen && editingInventory && (
        <UpdateInventoryModal
          inventory={editingInventory}
          isOpen={isUpdateModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default InventoryList; 