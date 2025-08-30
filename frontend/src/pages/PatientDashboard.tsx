import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Prescription, Order, RefillRequest } from '../types';
import apiService from '../services/api';
import PrescriptionUpload from '../components/PrescriptionUpload';
import TrackingTimeline from '../components/TrackingTimeline';
import AddressForm, { AddressFormValues } from '../components/AddressForm';
import OrderStatus from '../components/OrderStatus';
import PrescriptionModal from '../components/PrescriptionModal';
import Chat from '../components/Chat';
import ReminderSettings from '../components/ReminderSettings';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [fillHistory, setFillHistory] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<{[prescriptionId: string]: any[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestingRefill, setRequestingRefill] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForPrescription, setAddressForPrescription] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading patient dashboard data...');
      const [prescriptionsData, ordersData, refillRequestsData] = await Promise.all([
        apiService.getMyPrescriptions(), // Use the specific patient history endpoint
        apiService.getOrders(),
        apiService.getMyRefillRequests()
      ]);
      
      // Also load fill history if user ID is available
      let fillHistoryData: any[] = [];
      if (user?.id) {
        try {
          fillHistoryData = await apiService.getPatientFillHistory(user.id.toString());
        } catch (error) {
          console.log('Fill history not available yet:', error);
        }
      }
      
      console.log('Prescriptions data received:', prescriptionsData);
      console.log('Orders data received:', ordersData);
      console.log('Refill requests data received:', refillRequestsData);
      
      // Ensure we have arrays and add additional null checks
      const prescriptionsArray = Array.isArray(prescriptionsData) ? prescriptionsData : [];
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      const refillRequestsArray = Array.isArray(refillRequestsData) ? refillRequestsData : [];
      
      // Transform backend data to match frontend types with additional safety checks
      const transformedPrescriptions: Prescription[] = prescriptionsArray
        .filter((prescription: any) => prescription && prescription.id) // Only include valid prescriptions
        .map((prescription: any) => {
          const transformed = {
            id: prescription.id.toString(),
            patientId: prescription.patientId || '',
            patientName: prescription.patientName || '',
            imageUrl: prescription.imageUrl || '',
            fileUrl: prescription.fileUrl || '', // Use the new fileUrl field
            status: prescription.status || 'PENDING',
            notes: prescription.notes || '',
            createdAt: prescription.createdAt || new Date().toISOString(),
            updatedAt: prescription.updatedAt || new Date().toISOString()
          };
          console.log('Transformed prescription:', transformed);
          console.log('File URL:', transformed.fileUrl);
          return transformed;
        });
      
      const transformedOrders: Order[] = ordersArray
        .filter((order: any) => order && order.id) // Only include valid orders
        .map((order: any) => ({
          id: order.id.toString(),
          prescriptionId: order.prescriptionId?.toString() || '',
          patientId: order.patientId?.toString() || '',
          patientName: order.patientName || '',
          status: order.status || 'PENDING',
          medicines: order.medicines || [],
          totalAmount: order.totalAmount || 0,
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString()
        }));
      
      const transformedRefillRequests: RefillRequest[] = refillRequestsArray
        .filter((refill: any) => refill && refill.id)
        .map((refill: any) => ({
          id: refill.id.toString(),
          prescriptionId: refill.prescriptionId?.toString() || '',
          patientId: refill.patientId?.toString() || '',
          patientName: refill.patientName || '',
          pharmacistId: refill.pharmacistId?.toString() || '',
          pharmacistName: refill.pharmacistName || '',
          status: refill.status || 'PENDING',
          requestedAt: refill.requestedAt || new Date().toISOString(),
          actionedAt: refill.actionedAt || '',
          reasonForRejection: refill.reasonForRejection || ''
        }));
      
      console.log('Transformed prescriptions:', transformedPrescriptions);
      console.log('Transformed orders:', transformedOrders);
      console.log('Transformed refill requests:', transformedRefillRequests);
      
      setPrescriptions(transformedPrescriptions);
      setOrders(transformedOrders);
      setRefillRequests(transformedRefillRequests);
      setFillHistory(fillHistoryData);
      
      // Load tracking data for each prescription
      const trackingPromises = transformedPrescriptions.map(async (prescription) => {
        try {
          const tracking = await apiService.getTrackingHistory(prescription.id);
          return { prescId: prescription.id, tracking };
        } catch (error) {
          console.error(`Failed to load tracking for prescription ${prescription.id}:`, error);
          return { prescId: prescription.id, tracking: [] };
        }
      });
      
      const trackingResults = await Promise.all(trackingPromises);
      const trackingMap: {[key: string]: any[]} = {};
      trackingResults.forEach(result => {
        trackingMap[result.prescId] = result.tracking;
      });
      setTrackingData(trackingMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty arrays on error to prevent undefined errors
      setPrescriptions([]);
      setOrders([]);
      setRefillRequests([]);
      setFillHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionUpload = async (prescription: Prescription) => {
    console.log('New prescription uploaded:', prescription);
    setPrescriptions(prev => [prescription, ...prev]);
    // Reload data to ensure we have the latest information
    await loadData();
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  const handleRequestRefill = async (prescriptionId: string) => {
    setAddressForPrescription(prescriptionId);
    setIsAddressModalOpen(true);
  };

  const submitAddressForRefill = async (values: AddressFormValues) => {
    if (!addressForPrescription) return;
    try {
      setRequestingRefill(addressForPrescription);
      await apiService.requestRefill(addressForPrescription, values);
      alert('Refill request sent to pharmacist successfully!');
      await loadData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to request refill. Please try again.';
      alert(errorMessage);
    } finally {
      setRequestingRefill(null);
      setIsAddressModalOpen(false);
      setAddressForPrescription(null);
    }
  };

  const canRequestRefill = (prescription: Prescription) => {
    // Can only request refill for approved prescriptions
    if (prescription.status !== 'APPROVED') return false;
    
    // Check if there's already ANY refill request for this prescription (one-time only)
    const hasAnyRefillRequest = refillRequests.some(
      refill => refill.prescriptionId === prescription.id
    );
    
    return !hasAnyRefillRequest;
  };

  const getRefillStatus = (prescription: Prescription) => {
    const refillRequest = refillRequests.find(
      refill => refill.prescriptionId === prescription.id
    );
    return refillRequest?.status || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Move the log here
  console.log('Rendering prescriptions:', prescriptions);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-lg p-6 card-gradient shadow-md hover-lift animate-fade-in-up">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-gray-600">
              Manage your prescriptions and track your medication orders.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsReminderSettingsOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center animate-scale-in"
            >
              📧 Email Settings
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center animate-scale-in"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.083-1.555L3 21l3.445-3.917A9.013 9.013 0 013 12c0-4.418 4.418-8 9-8 4.582 0 8.26 3.582 8.26 8z" />
              </svg>
              Chat with Pharmacist
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prescription Upload */}
        <div className="card animate-fade-in-up hover-lift">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Upload New Prescription
          </h3>
          <PrescriptionUpload onUpload={handlePrescriptionUpload} />
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="card animate-fade-in-up hover-lift">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Orders
            </h3>
            <div className="space-y-4">
              {orders.slice(0, 3).map((order) => (
                <OrderStatus key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Medicine Fill History */}
      {fillHistory.length > 0 && (
        <div className="card animate-fade-in-up hover-lift">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Medicine Fill History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Filled</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicines & Quantities</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reminder</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2"/>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {fillHistory.slice(0, 6).map((history: any) => (
                  <tr key={history.id} className="align-top animate-fade-in-up">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(history.fillDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">#{history.prescriptionId?.toString().slice(-8) || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="space-y-1">
                        {(history.filledMedicines || []).map((fm: any, index: number) => (
                          <div key={`${history.id}-${index}`} className="flex justify-between gap-4">
                            <span>{fm.medicineName}</span>
                            <span className="text-gray-600">{fm.totalNeeded} ( {fm.timesPerDay || ((fm.morning?1:0)+(fm.afternoon?1:0)+(fm.night?1:0))}x × {fm.days} days )</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {history.refillReminderDate ? (
                        <span className="text-green-700 bg-green-50 rounded px-2 py-1">{new Date(history.refillReminderDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-500">No reminder</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${history.status === 'DISPATCHED' ? 'bg-green-100 text-green-800 soft-pulse' : 'bg-blue-100 text-blue-800'}`}>{history.status}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {history.prescriptionImageUrl && (
                        <button onClick={() => window.open(history.prescriptionImageUrl, '_blank')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View Prescription</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="card animate-fade-in-up">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Your Prescriptions ({prescriptions.length})
        </h3>
        {prescriptions.length === 0 ? (
          <p className="text-gray-500">No prescriptions uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {prescriptions
              .filter((prescription) => prescription && prescription.id)
              .map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 hover-lift animate-fade-in-up">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Prescription #{prescription.id ? prescription.id.slice(-8) : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded on {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      {prescription.fileUrl && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleViewPrescription(prescription)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                          >
                            View My Prescription
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prescription.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        prescription.status === 'REQUIRES_CLARIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status ? prescription.status.replace('_', ' ') : 'PENDING'}
                      </span>
                      
                      {/* Refill Request Status */}
                      {getRefillStatus(prescription) && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getRefillStatus(prescription) === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          getRefillStatus(prescription) === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          getRefillStatus(prescription) === 'FILLED' ? 'bg-yellow-100 text-yellow-800' :
                          getRefillStatus(prescription) === 'DISPATCHED' ? 'bg-green-100 text-green-800 soft-pulse' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          Refill: {getRefillStatus(prescription)}
                        </span>
                      )}
                      
                      {/* Request Refill Button */}
                      {canRequestRefill(prescription) && (
                        <button
                          onClick={() => handleRequestRefill(prescription.id)}
                          disabled={requestingRefill === prescription.id}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                        >
                          {requestingRefill === prescription.id ? 'Requesting...' : 'Request Refill'}
                        </button>
                      )}
                      
                      {prescription.fileUrl && (
                        <a
                          href={prescription.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                        >
                          Open in New Tab
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => setSelectedPrescription(prescription)} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md animate-scale-in">View Tracking</button>
                  </div>
                  {/* Tracking Timeline */}
                  <div className="mt-4">
                    {selectedPrescription?.id === prescription.id && (
                      <TrackingTimeline prescriptionId={prescription.id} fileUrl={prescription.fileUrl} onDelivered={loadData} />
                    )}
                  </div>
                  {prescription.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      Notes: {prescription.notes}
                    </p>
                  )}
                  {(() => {
                    const status = getRefillStatus(prescription);
                    // Check if prescription is delivered by checking tracking history
                    const isDelivered = trackingData[prescription.id]?.some((t: any) => t.status === 'DELIVERED');
                    
                    if (isDelivered) {
                      return <div className="mt-2 text-green-700 bg-green-50 rounded px-2 py-1 text-xs">✅ Medicines delivered successfully!</div>;
                    }
                    if (status === 'APPROVED') {
                      return <div className="mt-2 text-blue-700 bg-blue-50 rounded px-2 py-1 text-xs">Your refill is approved and being prepared.</div>;
                    }
                    if (status === 'FILLED') {
                      return <div className="mt-2 text-orange-700 bg-orange-50 rounded px-2 py-1 text-xs">Your medicines are ready for dispatch.</div>;
                    }
                    if (status === 'DISPATCHED') {
                      return <div className="mt-2 text-green-700 bg-green-50 rounded px-2 py-1 text-xs">Your refill has been dispatched.</div>;
                    }
                    return null;
                  })()}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        prescription={selectedPrescription}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Chat Modal */}
      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Reminder Settings Modal */}
      <ReminderSettings
        isOpen={isReminderSettingsOpen}
        onClose={() => setIsReminderSettingsOpen(false)}
      />

      {/* Address Modal for Refill */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <AddressForm
              title="Delivery Address for Refill"
              submitText={requestingRefill ? 'Submitting...' : 'Submit Refill Request'}
              onSubmit={submitAddressForRefill}
              onCancel={() => { setIsAddressModalOpen(false); setAddressForPrescription(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard; 