import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Prescription, Order, Medicine, Inventory, RefillRequest, RefillDetailDTO } from '../types';
import apiService from '../services/api';
import PrescriptionModal from '../components/PrescriptionModal';
import InventoryList from '../components/pharmacist/InventoryList';
import Chat from '../components/Chat';
import AdminChat from '../components/AdminChat';
import { toast } from 'react-toastify';

const PharmacistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'refills' | 'history'>('dashboard');
  const [processingRefill, setProcessingRefill] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [fillRefill, setFillRefill] = useState<RefillRequest | null>(null);
  const [fillQuantities, setFillQuantities] = useState<{ [medicineId: string]: number }>({});
  const [fillDays, setFillDays] = useState<{ [medicineId: string]: number }>({});
  const [fillTimes, setFillTimes] = useState<{ [medicineId: string]: { m: boolean; a: boolean; n: boolean } }>({});
  const [refillDetails, setRefillDetails] = useState<RefillDetailDTO | null>(null);
  const [fillLoading, setFillLoading] = useState(false);
  const [fillLowStock, setFillLowStock] = useState<string[]>([]);
  const [fillPrescription, setFillPrescription] = useState<Prescription | null>(null);
  const [pendingRefillRequests, setPendingRefillRequests] = useState<RefillRequest[]>([]);
  const [approvedRefillRequests, setApprovedRefillRequests] = useState<RefillRequest[]>([]);
  const [filledRefillRequests, setFilledRefillRequests] = useState<RefillRequest[]>([]);
  const [refillSearch, setRefillSearch] = useState('');
  const [fillHistory, setFillHistory] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<{[prescriptionId: string]: any[]}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prescriptionsData, ordersData, medicinesData, inventoryData, pendingRefills, approvedRefills, filledRefills] = await Promise.all([
        apiService.getPendingPrescriptions(),
        apiService.getOrders(),
        apiService.getMedicines(),
        apiService.getMyInventory(),
        apiService.getPharmacistRefillRequestsByStatus('PENDING').catch(() => []),
        apiService.getPharmacistRefillRequestsByStatus('APPROVED').catch(() => []),
        apiService.getPharmacistRefillRequestsByStatus('FILLED').catch(() => []),
      ]);
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      const pending = Array.isArray(pendingRefills) ? pendingRefills : [];
      const approved = Array.isArray(approvedRefills) ? approvedRefills : [];
      const filled = Array.isArray(filledRefills) ? filledRefills : [];
      setPendingRefillRequests(pending);
      setApprovedRefillRequests(approved);
      setFilledRefillRequests(filled);
      setRefillRequests([...pending, ...approved, ...filled]);
      if (user?.id) {
        const history = await apiService.getPharmacistFillHistory(String(user.id));
        const historyArray = Array.isArray(history) ? history : [];
        setFillHistory(historyArray);
        
        // Load tracking data for each prescription in history
        const trackingPromises = historyArray.map(async (h: any) => {
          const prescId = h.prescriptionId || h.prescription?.id;
          if (prescId) {
            const tracking = await apiService.getTrackingHistory(String(prescId));
            return { prescId: String(prescId), tracking };
          }
          return null;
        });
        
        const trackingResults = await Promise.all(trackingPromises);
        const trackingMap: {[key: string]: any[]} = {};
        trackingResults.forEach(result => {
          if (result) {
            trackingMap[result.prescId] = result.tracking;
          }
        });
        setTrackingData(trackingMap);
      }
    } catch (error) {
      setPrescriptions([]); setOrders([]); setMedicines([]); setInventory([]);
      setPendingRefillRequests([]); setApprovedRefillRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionStatusUpdate = async (prescriptionId: string, status: string, notes?: string) => {
    try {
      console.log(`Updating prescription ${prescriptionId} to status: ${status}`);
      if (status === 'APPROVED') {
        await apiService.approvePrescription(prescriptionId, notes);
        toast.success('Prescription approved successfully');
      } else if (status === 'REJECTED') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await apiService.rejectPrescription(prescriptionId, reason);
          toast.success('Prescription rejected');
        } else {
          return; // User cancelled
        }
      } else {
        await apiService.updatePrescriptionStatus(prescriptionId, status, notes);
        toast.success('Prescription status updated');
      }
      await loadData();
    } catch (error) {
      console.error('Failed to update prescription status:', error);
      toast.error('Failed to update prescription status');
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  const handleInventoryUpdate = async () => {
    await loadData();
  };

  const handleApproveRefill = async (refillId: string) => {
    try {
      setProcessingRefill(refillId);
      await apiService.approveRefillRequest(refillId);
      toast.success('Refill request approved successfully');
      // Move from pending to approved in state
      setPendingRefillRequests(prev => prev.filter(r => r.id !== refillId));
      const approved = pendingRefillRequests.find(r => r.id === refillId);
      if (approved) setApprovedRefillRequests(prev => [...prev, { ...approved, status: 'APPROVED' }]);
    } catch (error) {
      console.error('Failed to approve refill request:', error);
      toast.error('Failed to approve refill request');
    } finally { setProcessingRefill(null); }
  };

  const handleRejectRefill = async (refillId: string) => {
    try {
      const reason = prompt('Please provide a reason for rejection (optional):');
      setProcessingRefill(refillId);
      console.log(`Rejecting refill request ${refillId}`);
      await apiService.rejectRefillRequest(refillId, reason || undefined);
      toast.success('Refill request rejected');
      await loadData();
      console.log('Refill request rejected successfully');
    } catch (error) {
      console.error('Failed to reject refill request:', error);
      toast.error('Failed to reject refill request. Please try again.');
    } finally {
      setProcessingRefill(null);
    }
  };

  const handleOpenFillModal = async (refill: RefillRequest) => {
    if (refill.status !== 'APPROVED') {
      toast.error('Only approved requests can be filled');
      return;
    }
    setFillRefill(refill);
    setFillLowStock([]);
    setFillQuantities({});
    setFillDays({});
    setFillTimes({});
    setFillLoading(false);
    setFillPrescription(null);
    setRefillDetails(null);
    try {
      const [prescription, details] = await Promise.all([
        apiService.getPrescriptionById(refill.prescriptionId),
        apiService.getRefillDetails(refill.id)
      ]);
      setFillPrescription(prescription);
      setRefillDetails(details);
    } catch (error) {
      console.error('Failed to load refill details:', error);
      const pres = prescriptions.find(p => p.id === refill.prescriptionId);
      setFillPrescription(pres || null);
    }
    setFillModalOpen(true);
  };

  const handleCloseFillModal = () => {
    setFillModalOpen(false);
    setFillRefill(null);
    setFillPrescription(null);
    setFillQuantities({});
    setFillLowStock([]);
  };

  const handleFillQuantityChange = (medicineId: string, value: number) => {
    setFillQuantities(q => ({ ...q, [medicineId]: value }));
  };

  const handleSubmitFill = async () => {
    if (!fillRefill) return;
    setFillLoading(true);
    try {
      if (!refillDetails) { toast.error('Refill details not loaded.'); setFillLoading(false); return; }
      const items = refillDetails.items
        .map(it => ({
          medicineId: it.medicineId,
          morning: !!fillTimes[it.medicineId]?.m,
          afternoon: !!fillTimes[it.medicineId]?.a,
          night: !!fillTimes[it.medicineId]?.n,
          days: Number(fillDays[it.medicineId] || 0)
        }))
        .filter(i => (i.morning || i.afternoon || i.night) && i.days > 0);
      if (items.length === 0) { toast.error('Please select times and enter days for at least one medicine.'); setFillLoading(false); return; }
      
      // Decide whether to ask about reminders based on total days
      const totalDays = items.reduce((max, i) => Math.max(max, i.days), 0);
      let enableReminders = false;
      if (totalDays >= 7) {
        const confirmed = window.confirm('Do you want to enable refill reminders for this prescription?');
        if (!confirmed) {
          // Proceed with fill but without reminders
          enableReminders = false;
        } else {
          enableReminders = true;
        }
      }

      await apiService.postFillRefill(fillRefill.id, { items, enableReminders });
      toast.success('Medicines filled successfully');
      setApprovedRefillRequests(prev => prev.filter(r => r.id !== fillRefill.id));
      setTimeout(() => { handleCloseFillModal(); }, 1200);
      await loadData();
      if (enableReminders) {
        toast.info('Email refill reminders enabled.');
      } else if (totalDays >= 7) {
        toast.info('Email refill reminders disabled for this prescription.');
      } else {
        toast.info('Short duration (< 7 days). No reminders scheduled.');
      }
    } catch (error: any) { toast.error(error?.response?.data?.error || 'Failed to fill medicines.'); }
    finally { setFillLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderDashboardContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
      {/* Pending Prescriptions */}
      <div className="card hover-lift animate-scale-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Prescriptions ({prescriptions.length})
        </h3>
        {prescriptions.length === 0 ? (
          <p className="text-gray-500">No pending prescriptions.</p>
        ) : (
          <div className="space-y-4">
            {prescriptions
              .filter(p => p.status === 'PENDING')
              .slice(0, 5)
              .map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 transition-colors hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Prescription #{prescription.id ? prescription.id.slice(-8) : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Patient: {prescription.patientName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      PENDING
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewPrescription(prescription)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      View Prescription
                    </button>
                    <button
                      onClick={() => handlePrescriptionStatusUpdate(prescription.id, 'APPROVED')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handlePrescriptionStatusUpdate(prescription.id, 'REJECTED')}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handlePrescriptionStatusUpdate(prescription.id, 'REQUIRES_CLARIFICATION')}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                    >
                      Need Info
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Recent Orders - hidden until feature is implemented */}
      {orders.length > 0 && (
        <div className="card hover-lift animate-scale-in">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                {/* order content */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Medicines */}
      <div className="card hover-lift animate-scale-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Low Stock Medicines
        </h3>
        {inventory.filter(item => item.isLowStock).length === 0 ? (
          <p className="text-gray-500">All medicines are well stocked.</p>
        ) : (
          <div className="space-y-4">
            {inventory
              .filter(item => item.isLowStock)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 transition-colors hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.medicineName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.strength} - {item.dosageForm}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.stockQuantity || 0} left
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRefillRequestsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center animate-fade-in-up">
        <h3 className="text-xl font-semibold text-gray-900">Pending Refill Requests ({pendingRefillRequests.length})</h3>
      </div>
      {/* Pending requests */}
      {pendingRefillRequests.length === 0 ? <div className="text-center py-12"><p className="text-gray-500 text-lg">No pending refill requests.</p></div> : (
        <div className="grid gap-6">
          {pendingRefillRequests.map(refill => (
            <div key={refill.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md hover-lift animate-fade-in-up">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      Refill Request #{refill.id.slice(-8)}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {refill.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><span className="font-medium">Patient:</span> {refill.patientName}</p>
                      <p><span className="font-medium">Prescription ID:</span> #{refill.prescriptionId.slice(-8)}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Requested:</span> {new Date(refill.requestedAt).toLocaleDateString()}</p>
                      <p><span className="font-medium">Time:</span> {new Date(refill.requestedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  {(refill.addressLine1 || refill.city) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border text-sm">
                      <div className="font-medium text-gray-700 mb-1">Delivery Address</div>
                      <div className="text-gray-700">
                        {refill.addressLine1} {refill.addressLine2 ? `, ${refill.addressLine2}` : ''}, {refill.city}, {refill.state} - {refill.pincode}
                      </div>
                      {refill.phone && <div className="text-gray-600 mt-1">📞 {refill.phone}</div>}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleApproveRefill(refill.id)}
                  disabled={processingRefill === refill.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium transition-colors"
                >
                  {processingRefill === refill.id ? 'Processing...' : 'Approve Refill'}
                </button>
                <button
                  onClick={() => handleRejectRefill(refill.id)}
                  disabled={processingRefill === refill.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md font-medium transition-colors"
                >
                  {processingRefill === refill.id ? 'Processing...' : 'Reject Refill'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center mt-8 animate-fade-in-up">
        <h3 className="text-xl font-semibold text-gray-900">Approved Refill Requests ({approvedRefillRequests.length})</h3>
      </div>
      {/* Approved requests */}
      {approvedRefillRequests.length === 0 ? <div className="text-center py-12"><p className="text-gray-500 text-lg">No approved refill requests.</p></div> : (
        <div className="grid gap-6">
          {approvedRefillRequests.map(refill => (
            <div key={refill.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md hover-lift animate-fade-in-up">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      Refill Request #{refill.id.slice(-8)}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {refill.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><span className="font-medium">Patient:</span> {refill.patientName}</p>
                      <p><span className="font-medium">Prescription ID:</span> #{refill.prescriptionId.slice(-8)}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Requested:</span> {new Date(refill.requestedAt).toLocaleDateString()}</p>
                      <p><span className="font-medium">Time:</span> {new Date(refill.requestedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                {refill.status === 'APPROVED' ? (
                  <button onClick={() => handleOpenFillModal(refill)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Fill Medicines</button>
                ) : (
                  <span className="text-sm text-gray-500">Already {refill.status.toLowerCase()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <h3 className="text-xl font-semibold text-gray-900">Filling History</h3>
      </div>
      {fillHistory.length === 0 ? (
        <div className="text-gray-500">No history yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {fillHistory.map((h: any) => (
            <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover-lift animate-fade-in-up transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">{new Date(h.fillDate).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Patient: {h.patientName || h.patient?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">Prescription #{(h.prescriptionId || h.prescription?.id || '').toString().slice(-8)}</div>
                </div>
                {h.prescriptionImageUrl && (
                  <button onClick={() => window.open(h.prescriptionImageUrl, '_blank')} className="text-blue-600 text-sm font-medium">View Prescription</button>
                )}
              </div>
              <div className="mt-4">
                {(h.filledMedicines || []).map((fm: any, idx: number) => (
                  <div key={`${h.id}-${idx}`} className="flex justify-between py-1 text-sm border-t first:border-t-0">
                    <span>{fm.medicineName}</span>
                    <span className="text-gray-700 font-medium">{fm.totalNeeded}</span>
                  </div>
                ))}
              </div>
              {h.refillReminderDate && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 rounded px-2 py-1 inline-block">Refill Reminder: {new Date(h.refillReminderDate).toLocaleDateString()}</div>
              )}
              {/* Status-based messages and actions */}
              {h.status === 'DISPATCHED' && (
                <div className="mt-3 text-sm text-green-700 bg-green-50 rounded px-3 py-2">
                  {(() => {
                    const prescId = String(h.prescriptionId || h.prescription?.id);
                    const isDelivered = trackingData[prescId]?.some(t => t.status === 'DELIVERED');
                    
                    if (isDelivered) {
                      return (
                        <>
                          ✅ Medicines dispatched successfully
                          <br />
                          🎉 <strong>Delivered to patient!</strong>
                        </>
                      );
                    } else {
                      return '✅ Medicines dispatched successfully';
                    }
                  })()}
                </div>
              )}
              
              {/* Dispatch button for pharmacist - only show for FILLED status */}
              {h.status === 'FILLED' && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      try {
                        // Find matching refill request id from approved list by prescription id
                        const prescId = h.prescriptionId || h.prescription?.id;
                        console.log('Looking for prescription ID:', prescId);
                        console.log('Available refill requests:', approvedRefillRequests.map(r => ({id: r.id, prescriptionId: r.prescriptionId, status: r.status})));
                        
                        // Backend now accepts either refill id or prescription id; if no match, call dispatch with prescription id
                        const match = [...approvedRefillRequests, ...filledRefillRequests].find(r => 
                          r.prescriptionId?.toString() === prescId?.toString() && 
                          (r.status === 'FILLED' || r.status === 'APPROVED')
                        );
                        
                        if (match) {
                          await apiService.dispatchRefill(match.id);
                          toast.success('Refill dispatched successfully!');
                          await loadData(); // Reload data to update UI
                        } else {
                          // Fallback: try dispatch by prescription id (server resolves to latest)
                          try {
                            await apiService.dispatchRefill(String(prescId));
                            toast.success('Refill dispatched successfully!');
                            await loadData();
                          } catch (err) {
                            console.error('No match found. PrescId:', prescId, 'Available:', approvedRefillRequests);
                            toast.error('Could not find matching refill request');
                          }
                        }
                      } catch (e) { 
                        console.error('Dispatch error:', e);
                        toast.error('Failed to dispatch refill');
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                  >
                    Mark Dispatched
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6 card-gradient animate-fade-in-up">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-gray-600">
              Review prescriptions and manage medication inventory.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center animate-slide-in-right"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.083-1.555L3 21l3.445-3.917A9.013 9.013 0 013 12c0-4.418 4.418-8 9-8 4.582 0 8.26 3.582 8.26 8z" />
              </svg>
              Chat with Patients
            </button>
            <button
              onClick={() => setIsAdminChatOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center animate-slide-in-right"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Admin Chat
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory Management
            </button>
            <button
              onClick={() => setActiveTab('refills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'refills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Refill Requests ({refillRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Filling History
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'dashboard' ? renderDashboardContent() : 
           activeTab === 'inventory' ? (
            <InventoryList 
              inventory={inventory}
              medicines={medicines}
              onUpdate={handleInventoryUpdate}
            />
           ) : activeTab === 'refills' ? renderRefillRequestsContent() : renderHistoryContent()}
        </div>
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

      {/* Admin Chat Modal */}
      <AdminChat
        isOpen={isAdminChatOpen}
        onClose={() => setIsAdminChatOpen(false)}
      />

      {fillModalOpen && fillRefill && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button onClick={handleCloseFillModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">Fill Medicines for Refill #{fillRefill.id.slice(-8)}</h3>
            {fillPrescription && (
              <div className="mb-4">
                <div className="mb-2 font-medium flex items-center justify-between">
                  <span>Prescription ID: #{fillRefill?.prescriptionId?.slice(-8)}</span>
                  {fillPrescription.fileUrl && (
                    <button 
                      onClick={() => window.open(fillPrescription.fileUrl, '_blank')} 
                      className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Prescription
                    </button>
                  )}
                </div>
                <div className="mb-2 font-medium">Prescription Image:</div>
                {fillPrescription.fileUrl ? (
                  <img 
                    src={fillPrescription.fileUrl} 
                    alt="Prescription" 
                    className="max-h-48 rounded border object-contain"
                    onError={(e) => {
                      console.error('Failed to load prescription image:', fillPrescription.fileUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : fillPrescription.imageUrl ? (
                  <img 
                    src={fillPrescription.imageUrl} 
                    alt="Prescription" 
                    className="max-h-48 rounded border object-contain"
                    onError={(e) => {
                      console.error('Failed to load prescription image:', fillPrescription.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-gray-500">No image available</span>
                )}
              </div>
            )}
            <input type="text" value={refillSearch} onChange={e => setRefillSearch(e.target.value)} placeholder="Search medicine..." className="mb-2 border rounded px-2 py-1 w-full" />
            <div className="space-y-2">
              <div className="grid grid-cols-8 gap-2 font-medium text-sm text-gray-700">
                <div className="col-span-2">Medicine</div>
                <div className="text-center">Morning</div>
                <div className="text-center">Afternoon</div>
                <div className="text-center">Night</div>
                <div className="text-center">Days</div>
                <div className="text-center">Total Needed</div>
                <div className="text-center">Stock</div>
              </div>
              {refillDetails?.items
                .filter(it => it.medicineName.toLowerCase().includes(refillSearch.toLowerCase()))
                .map(it => {
                  const times = (fillTimes[it.medicineId]?.m ? 1 : 0) + (fillTimes[it.medicineId]?.a ? 1 : 0) + (fillTimes[it.medicineId]?.n ? 1 : 0);
                  const days = Number(fillDays[it.medicineId] || 0);
                  const total = times * days;
                  return (
                    <div key={it.medicineId} className="grid grid-cols-8 gap-2 items-center text-sm">
                      <div className="col-span-2 truncate" title={it.medicineName}>{it.medicineName}</div>
                      <div className="text-center">
                        <input type="checkbox" checked={!!fillTimes[it.medicineId]?.m} onChange={e => setFillTimes(prev => ({ ...prev, [it.medicineId]: { m: e.target.checked, a: prev[it.medicineId]?.a || false, n: prev[it.medicineId]?.n || false } }))} />
                      </div>
                      <div className="text-center">
                        <input type="checkbox" checked={!!fillTimes[it.medicineId]?.a} onChange={e => setFillTimes(prev => ({ ...prev, [it.medicineId]: { m: prev[it.medicineId]?.m || false, a: e.target.checked, n: prev[it.medicineId]?.n || false } }))} />
                      </div>
                      <div className="text-center">
                        <input type="checkbox" checked={!!fillTimes[it.medicineId]?.n} onChange={e => setFillTimes(prev => ({ ...prev, [it.medicineId]: { m: prev[it.medicineId]?.m || false, a: prev[it.medicineId]?.a || false, n: e.target.checked } }))} />
                      </div>
                      <div className="text-center">
                        <input type="number" min={0} className="w-20 border rounded px-2 py-1" value={fillDays[it.medicineId] || ''} onChange={e => setFillDays(prev => ({ ...prev, [it.medicineId]: Number(e.target.value) }))} />
                      </div>
                      <div className="text-center">{total}</div>
                      <div className="text-center">{it.stock}</div>
                    </div>
                  );
                })}
            </div>
            {fillLowStock.length > 0 && (
              <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
                Warning: Low stock for {fillLowStock.join(', ')}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSubmitFill}
                disabled={fillLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {fillLoading ? 'Filling...' : 'Submit'}
              </button>
              <button
                onClick={handleCloseFillModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard; 