import React from 'react';
import { Order } from '../types';

interface OrderStatusProps {
  order: Order;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ order }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'READY_FOR_PICKUP':
        return 'bg-blue-100 text-blue-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return '✓';
      case 'CANCELLED':
        return '✗';
      case 'READY_FOR_PICKUP':
        return '📦';
      case 'OUT_FOR_DELIVERY':
        return '🚚';
      case 'PROCESSING':
        return '⚙️';
      default:
        return '⏳';
    }
  };

  // Add null checks for order properties
  if (!order || !order.id) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-gray-500">Invalid order data</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">
            Order #{order.id ? order.id.slice(-8) : 'N/A'}
          </h4>
          <p className="text-sm text-gray-500">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'PENDING')}`}>
          {getStatusIcon(order.status || 'PENDING')} {(order.status || 'PENDING').replace('_', ' ')}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">${order.totalAmount || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Medicines:</span>
          <span className="font-medium">{order.medicines ? order.medicines.length : 0} items</span>
        </div>
      </div>

      {order.medicines && order.medicines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Medicines:</p>
          <div className="space-y-1">
            {order.medicines.slice(0, 2).map((medicine) => (
              <div key={medicine.id} className="flex justify-between text-xs">
                <span className="text-gray-600 truncate">{medicine.medicineName || 'Unknown'}</span>
                <span className="text-gray-500">x{medicine.quantity || 0}</span>
              </div>
            ))}
            {order.medicines.length > 2 && (
              <p className="text-xs text-gray-500">
                +{order.medicines.length - 2} more items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatus; 