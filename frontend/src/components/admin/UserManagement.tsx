import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import apiService from '../../services/api';
import { toast } from 'react-toastify';
// Temporarily using text instead of icons due to import issues

interface UserManagementProps {
  users: User[];
  onUserUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUserUpdate }) => {
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [roleFilter, setRoleFilter] = useState<string>('PHARMACIST');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, searchTerm]);

  const filterUsers = () => {
    // Admin is allowed to manage only PHARMACIST accounts
    let filtered = users.filter(user => user.role === 'PHARMACIST');

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleStatusToggle = async (user: User) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };

  const confirmStatusToggle = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await apiService.updateUserStatus(selectedUser.id, !selectedUser.active);
      toast.success(`User ${selectedUser.active ? 'deactivated' : 'activated'} successfully`);
      onUserUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
      setSelectedUser(null);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await apiService.deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      onUserUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'PHARMACIST': return 'bg-blue-100 text-blue-800';
      case 'PATIENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            Managing: Pharmacists only
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.active)}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleStatusToggle(user)}
                      className="text-orange-600 hover:text-orange-900 transition-colors duration-200"
                      title={user.active ? 'Deactivate' : 'Activate'}
                    >
                      {user.active ? '🟢' : '🔴'}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
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

      {/* Deactivate/Activate Confirmation Modal */}
      {showDeactivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser.active ? 'Deactivate' : 'Activate'} User
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {selectedUser.active ? 'deactivate' : 'activate'} <strong>{selectedUser.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusToggle}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Updating...' : (selectedUser.active ? 'Deactivate' : 'Activate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
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

export default UserManagement; 