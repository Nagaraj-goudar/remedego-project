import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Prescription, 
  Order, 
  Medicine, 
  RefillRequest, 
  RegisterData, 
  LoginData,
  ApiResponse,
  Inventory,
  Message,
  ChatUser,
  RefillDetailDTO,
  FilledItemInput,
  MedicineFillHistoryEntry,
  Pharmacist
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        } else {
          console.log('No token found in localStorage');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginData): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
      await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async register(userData: RegisterData): Promise<{ user: User; token: string }> {
    console.log('API: Registering user with data:', userData);
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = 
      await this.api.post('/auth/register', userData);
    console.log('API: Registration response:', response.data);
    return response.data.data!;
  }

  async forgotPassword(email: string): Promise<void> {
    console.log('API: Forgot password request for email:', email);
    const response = await this.api.post('/auth/forgot-password', { email });
    console.log('API: Forgot password response:', response.data);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/reset-password', { token, newPassword });
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = 
      await this.api.get('/auth/me');
    return response.data.data!;
  }

  async updateCurrentUser(payload: { name?: string; phone?: string; address?: string; dateOfBirth?: string; licenseNumber?: string }): Promise<User> {
    // Convert date string to proper format if provided
    const apiPayload: any = { ...payload };
    if (payload.dateOfBirth) {
      apiPayload.dateOfBirth = payload.dateOfBirth;
    }
    
    const response: AxiosResponse<ApiResponse<User>> =
      await this.api.put('/auth/me', apiPayload);
    return response.data.data!;
  }

  async uploadProfilePhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<ApiResponse<string>> =
      await this.api.post('/auth/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data.data!;
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<string> {
    const response: AxiosResponse<ApiResponse<string>> =
      await this.api.put('/auth/update-password', {
        oldPassword,
        newPassword
      });
    return response.data.data!;
  }

  // Prescription endpoints
  async uploadPrescription(file: File): Promise<Prescription> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<ApiResponse<Prescription>> = 
      await this.api.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data.data!;
  }

  // Get patient's prescription history
  async getMyPrescriptions(): Promise<Prescription[]> {
    const response: AxiosResponse<ApiResponse<Prescription[]>> = 
      await this.api.get('/prescriptions/my-history');
    return response.data.data!;
  }

  // Get pending prescriptions (for pharmacists)
  async getPendingPrescriptions(): Promise<Prescription[]> {
    const response: AxiosResponse<ApiResponse<Prescription[]>> = 
      await this.api.get('/prescriptions/pending');
    return response.data.data!;
  }

  // Get all prescriptions (for pharmacists)
  async getPrescriptions(): Promise<Prescription[]> {
    const response: AxiosResponse<ApiResponse<Prescription[]>> = 
      await this.api.get('/prescriptions');
    return response.data.data!;
  }

  async updatePrescriptionStatus(id: string, status: string, notes?: string): Promise<Prescription> {
    const response: AxiosResponse<ApiResponse<Prescription>> = 
      await this.api.put(`/prescriptions/${id}/status`, { status, notes });
    return response.data.data!;
  }

  async approvePrescription(id: string, notes?: string): Promise<Prescription> {
    const response: AxiosResponse<ApiResponse<Prescription>> = 
      await this.api.put(`/prescriptions/${id}/approve`, { notes });
    return response.data.data!;
  }

  async rejectPrescription(id: string, reason: string): Promise<Prescription> {
    const response: AxiosResponse<ApiResponse<Prescription>> = 
      await this.api.put(`/prescriptions/${id}/reject`, { reason });
    return response.data.data!;
  }

  async getPrescriptionById(id: string): Promise<Prescription> {
    const response: AxiosResponse<ApiResponse<Prescription>> = 
      await this.api.get(`/prescriptions/${id}`);
    return response.data.data!;
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    const response: AxiosResponse<ApiResponse<Order[]>> = 
      await this.api.get('/orders');
    return response.data.data!;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response: AxiosResponse<ApiResponse<Order>> = 
      await this.api.put(`/orders/${id}/status`, { status });
    return response.data.data!;
  }

  // Medicine endpoints
  async getMedicines(): Promise<Medicine[]> {
    const response: AxiosResponse<ApiResponse<Medicine[]>> = 
      await this.api.get('/medicines');
    return response.data.data!;
  }

  async createMedicine(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> {
    const response: AxiosResponse<ApiResponse<Medicine>> = 
      await this.api.post('/medicines', medicine);
    return response.data.data!;
  }

  async updateMedicine(id: number, medicine: Partial<Medicine>): Promise<Medicine> {
    const response: AxiosResponse<ApiResponse<Medicine>> = 
      await this.api.put(`/medicines/${id}`, medicine);
    return response.data.data!;
  }

  async deleteMedicine(id: number): Promise<void> {
    await this.api.delete(`/medicines/${id}`);
  }

  // Inventory endpoints
  async getMyInventory(): Promise<Inventory[]> {
    const response: AxiosResponse<ApiResponse<Inventory[]>> = 
      await this.api.get('/inventory/my-stock');
    return response.data.data!;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    const response: AxiosResponse<ApiResponse<Inventory[]>> = 
      await this.api.get('/inventory/low-stock');
    return response.data.data!;
  }

  async addMedicineToInventory(medicineId: number, stockQuantity: number, lowStockThreshold: number, expiryDate?: string): Promise<Inventory> {
    const response: AxiosResponse<ApiResponse<Inventory>> = 
      await this.api.post('/inventory/add', {
        medicineId,
        stockQuantity,
        lowStockThreshold,
        expiryDate
      });
    return response.data.data!;
  }

  async updateInventory(id: string, stockQuantity: number, lowStockThreshold: number, expiryDate?: string): Promise<Inventory> {
    const response: AxiosResponse<ApiResponse<Inventory>> = 
      await this.api.put(`/inventory/${id}`, {
        stockQuantity,
        lowStockThreshold,
        expiryDate
      });
    return response.data.data!;
  }

  // Refill request endpoints
  async requestRefill(prescriptionId: string, address: { line1: string; line2?: string; city: string; state: string; pincode: string; phone: string }): Promise<RefillRequest> {
    const response: AxiosResponse<ApiResponse<RefillRequest>> = 
      await this.api.post('/patient/refill-requests', { prescriptionId, address });
    return response.data.data!;
  }

  async getMyRefillRequests(): Promise<RefillRequest[]> {
    const response: AxiosResponse<ApiResponse<RefillRequest[]>> = 
      await this.api.get('/patient/refill-requests');
    return response.data.data!;
  }

  async getPendingRefillRequests(): Promise<RefillRequest[]> {
    const response: AxiosResponse<ApiResponse<RefillRequest[]>> = 
      await this.api.get('/pharmacist/refill-requests');
    return response.data.data!;
  }

  async approveRefillRequest(id: string): Promise<RefillRequest> {
    const response: AxiosResponse<ApiResponse<RefillRequest>> = 
      await this.api.put(`/pharmacist/refill-requests/${id}/approve`);
    return response.data.data!;
  }

  async rejectRefillRequest(id: string, reason?: string): Promise<RefillRequest> {
    const response: AxiosResponse<ApiResponse<RefillRequest>> = 
      await this.api.put(`/pharmacist/refill-requests/${id}/reject`, { reason });
    return response.data.data!;
  }

  async fillRefillRequest(id: string, items: { medicineId: string | number; quantity: number }[]): Promise<{ message: string; lowStockAlerts: string[] }> {
    // Backend expects a raw JSON array (List<MedicineFillItem>)
    const response: AxiosResponse<ApiResponse<{ message: string; lowStockAlerts: string[] }>> = 
      await this.api.put(`/pharmacist/refill-requests/${id}/fill`, items);
    return response.data.data!;
  }

  async getPharmacistRefillRequestsByStatus(status?: string): Promise<RefillRequest[]> {
    const response: AxiosResponse<ApiResponse<RefillRequest[]>> = 
      await this.api.get(`/pharmacist/refill-requests${status ? `?status=${status}` : ''}`);
    return response.data.data!;
  }

  // New pharmacist fill flow APIs
  async getRefillDetails(id: string): Promise<RefillDetailDTO> {
    const response: AxiosResponse<ApiResponse<RefillDetailDTO>> = await this.api.get(`/refills/${id}`);
    return response.data.data!;
  }

  async postFillRefill(id: string, request: { items: FilledItemInput[]; enableReminders: boolean }): Promise<string> {
    const response: AxiosResponse<ApiResponse<string>> = await this.api.post(`/refills/${id}/fill`, request);
    return response.data.data || response.data.message || 'Filled';
  }

  async createRefillReminder(prescriptionId: string, patientId: string, daysUntilRefill: number) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/reminders`, { prescriptionId, patientId, daysUntilRefill });
    return response.data.data;
  }

  async getPatientFillHistory(patientId: string) {
    try {
      const response: AxiosResponse<ApiResponse<MedicineFillHistoryEntry[]>> = await this.api.get(`/history/patient/${patientId}`);
      return response.data.data || [];
    } catch (error) {
      console.log('Patient fill history endpoint not available yet:', error);
      return [];
    }
  }

  async getPharmacistFillHistory(pharmacistId: string) {
    const response: AxiosResponse<ApiResponse<MedicineFillHistoryEntry[]>> = await this.api.get(`/history/pharmacist/${pharmacistId}`);
    return response.data.data || [];
  }

  // Tracking
  public get baseURL() { return (this.api.defaults.baseURL || '').replace(/\/$/, ''); }
  async getTrackingHistory(prescriptionId: string) {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/tracking/${prescriptionId}`);
      return response.data.data || [];
    } catch (e) {
      return [];
    }
  }

  async markDelivered(prescriptionId: string) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/tracking/${prescriptionId}/delivered`, {});
    return response.data.data;
  }

  // helper used by timeline to mark dispatch using prescriptionId -> resolve refill request id server-side (simple endpoint alternative)
  async dispatchRefillByPrescription(prescriptionId: string) {
    // If you later add a dedicated endpoint, replace this call.
    // For now this is a no-op placeholder to keep UI responsive.
    return Promise.resolve();
  }

  async dispatchRefill(historyId: string) {
    // If you have refill request id, call /refills/{id}/dispatch. Here we assume historyId is refill id; adapt if needed.
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/refills/${historyId}/dispatch`, {});
    return response.data.data;
  }

  // Chat endpoints
  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const response: AxiosResponse<ApiResponse<Message>> = 
      await this.api.post('/chat/send', { receiverId, content });
    return response.data.data!;
  }

  async getConversation(userId: string): Promise<Message[]> {
    const response: AxiosResponse<ApiResponse<Message[]>> = 
      await this.api.get(`/chat/conversation/${userId}`);
    return response.data.data!;
  }

  async getAvailableChatUsers(): Promise<ChatUser[]> {
    const response: AxiosResponse<ApiResponse<ChatUser[]>> = 
      await this.api.get('/chat/users');
    return response.data.data!;
  }

  async getConversationPartners(): Promise<ChatUser[]> {
    const response: AxiosResponse<ApiResponse<ChatUser[]>> = 
      await this.api.get('/chat/partners');
    return response.data.data!;
  }

  async getUnreadMessageCount(): Promise<{ unreadCount: number }> {
    const response: AxiosResponse<ApiResponse<{ unreadCount: number }>> = 
      await this.api.get('/chat/unread-count');
    return response.data.data!;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response: AxiosResponse<ApiResponse<Message>> = 
      await this.api.put(`/chat/messages/${messageId}`, { content });
    return response.data.data!;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.api.delete(`/chat/messages/${messageId}`);
  }

  // Admin Endpoints
  async getPendingPharmacists(): Promise<Pharmacist[]> {
    const response: AxiosResponse<ApiResponse<Pharmacist[]>> = 
      await this.api.get('/admin/pending-pharmacists');
    return response.data.data!;
  }

  async getAllPharmacists(): Promise<Pharmacist[]> {
    const response: AxiosResponse<ApiResponse<Pharmacist[]>> = 
      await this.api.get('/admin/all-pharmacists');
    return response.data.data!;
  }

  async approvePharmacist(pharmacistId: number): Promise<void> {
    await this.api.post(`/admin/pharmacists/${pharmacistId}/approve`);
  }

  async rejectPharmacist(pharmacistId: number, reason?: string): Promise<void> {
    await this.api.post(`/admin/pharmacists/${pharmacistId}/reject`, { reason });
  }

  async getPharmacistDetails(pharmacistId: number): Promise<Pharmacist> {
    const response: AxiosResponse<ApiResponse<Pharmacist>> = 
      await this.api.get(`/admin/pharmacists/${pharmacistId}`);
    return response.data.data!;
  }

  // User Management
  async getAllUsers(): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = 
      await this.api.get('/admin/users');
    return response.data.data!;
  }

  async updateUserStatus(userId: number, active: boolean): Promise<void> {
    await this.api.put(`/admin/users/${userId}/status`, { active });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.api.delete(`/admin/users/${userId}`);
  }

  // Reminder endpoints
  async updateReminderSettings(enabled: boolean): Promise<{ message: string }> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> = 
      await this.api.put('/reminders/settings', { enabled });
    return response.data.data!;
  }

  async getReminderStats(): Promise<{
    totalReminders: number;
    enabledReminders: number;
    dueToday: number;
    sentToday: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      totalReminders: number;
      enabledReminders: number;
      dueToday: number;
      sentToday: number;
    }>> = await this.api.get('/reminders/stats');
    return response.data.data!;
  }

  async getSmsStatus(): Promise<{ configured: boolean; message: string }> {
    const response: AxiosResponse<ApiResponse<{ configured: boolean; message: string }>> = 
      await this.api.get('/reminders/sms-status');
    return response.data.data!;
  }

  async triggerReminderCheck(): Promise<{ message: string }> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> = 
      await this.api.post('/reminders/trigger-check');
    return response.data.data!;
  }

  async testSms(phoneNumber: string, message: string): Promise<{ message: string }> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> = 
      await this.api.post('/reminders/test-sms', { phoneNumber, message });
    return response.data.data!;
  }
}

export default new ApiService(); 