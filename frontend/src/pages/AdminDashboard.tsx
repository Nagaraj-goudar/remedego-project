import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import { toast } from 'react-toastify';
// Temporarily using text instead of icons due to import issues
import MedicineCatalog from '../components/admin/MedicineCatalog';
import UserManagement from '../components/admin/UserManagement';
import AdminChat from '../components/AdminChat';
import apiService from '../services/api';
import { User, Medicine, Pharmacist } from '../types';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [pendingPharmacists, setPendingPharmacists] = useState<Pharmacist[]>([]);
  const [allPharmacists, setAllPharmacists] = useState<Pharmacist[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingResponse, allResponse, usersResponse, medicinesResponse] = await Promise.all([
        apiService.getPendingPharmacists(),
        apiService.getAllPharmacists(),
        apiService.getAllUsers(),
        apiService.getMedicines()
      ]);
      setPendingPharmacists(pendingResponse);
      setAllPharmacists(allResponse);
      setAllUsers(usersResponse);
      setMedicines(medicinesResponse);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUserUpdate = () => {
    loadData();
  };

  const handleMedicineUpdate = () => {
    loadData();
  };

  const handleApprovePharmacist = async (pharmacistId: number) => {
    try {
      await apiService.approvePharmacist(pharmacistId);
      toast.success('Pharmacist approved successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve pharmacist');
    }
  };

  const handleRejectPharmacist = async (pharmacistId: number, reason?: string) => {
    try {
      await apiService.rejectPharmacist(pharmacistId, reason);
      toast.success('Pharmacist rejected successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject pharmacist');
    }
  };

  const getDashboardStats = () => {
    const totalMedicines = medicines.length;
    const pendingApprovals = pendingPharmacists.length;
    const lowStockItems = 0; // TODO: Implement low stock calculation
    const totalUsers = allUsers.length;

    return { totalMedicines, pendingApprovals, lowStockItems, totalUsers };
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowChat(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                💬 Chat with Pharmacists
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'medicines'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medicine Catalog
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pharmacist Approvals
              {pendingPharmacists.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {pendingPharmacists.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                                 <div className="flex items-center">
                   <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-2xl">
                     💊
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Total Medicines</p>
                     <p className="text-2xl font-semibold text-gray-900">{stats.totalMedicines}</p>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                                 <div className="flex items-center">
                   <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 text-2xl">
                     ⏰
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                     <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                                 <div className="flex items-center">
                   <div className="p-3 rounded-full bg-red-100 text-red-600 text-2xl">
                     ⚠️
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                     <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                                 <div className="flex items-center">
                   <div className="p-3 rounded-full bg-green-100 text-green-600 text-2xl">
                     👥
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Total Users</p>
                     <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                   </div>
                 </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <button
                   onClick={() => setActiveTab('medicines')}
                   className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                 >
                   <div className="text-blue-600 mb-2 text-2xl">💊</div>
                   <h4 className="font-medium text-gray-900">Manage Medicines</h4>
                   <p className="text-sm text-gray-600">Add, edit, or remove medicines</p>
                 </button>
                 <button
                   onClick={() => setActiveTab('users')}
                   className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                 >
                   <div className="text-green-600 mb-2 text-2xl">👥</div>
                   <h4 className="font-medium text-gray-900">Manage Users</h4>
                   <p className="text-sm text-gray-600">View and manage user accounts</p>
                 </button>
                 <button
                   onClick={() => setActiveTab('approvals')}
                   className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                 >
                   <div className="text-yellow-600 mb-2 text-2xl">⏰</div>
                   <h4 className="font-medium text-gray-900">Review Approvals</h4>
                   <p className="text-sm text-gray-600">Approve or reject pharmacist applications</p>
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medicines' && (
          <MedicineCatalog medicines={medicines} onMedicineUpdate={handleMedicineUpdate} />
        )}

        {activeTab === 'users' && (
          <UserManagement users={allUsers} onUserUpdate={handleUserUpdate} />
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pharmacist Approvals</h2>
            {pendingPharmacists.length === 0 ? (
                             <div className="text-center py-8">
                 <div className="text-gray-400 mx-auto mb-4 text-4xl">⏰</div>
                 <p className="text-gray-600">No pending pharmacist approvals</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingPharmacists.map((pharmacist) => (
                      <tr key={pharmacist.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pharmacist.name}</div>
                            <div className="text-sm text-gray-500">{pharmacist.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pharmacist.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pharmacist.licenseNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pharmacist.createdAt ? new Date(pharmacist.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprovePharmacist(pharmacist.id)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPharmacist(pharmacist.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && (
        <AdminChat isOpen={showChat} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
