export interface User {
  id: number;
  email: string;
  name: string;
  role: 'PATIENT' | 'PHARMACIST' | 'ADMIN';
  phone?: string;
  profilePhoto?: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  role: 'PATIENT';
  dateOfBirth?: string;
  address?: string;
}

export interface Pharmacist extends User {
  role: 'PHARMACIST';
  licenseNumber: string;
  isApproved: boolean;
}

export interface Admin extends User {
  role: 'ADMIN';
}

export interface Medicine {
  id: number;
  name: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  medicineId: string;
  medicineName: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  lastUpdated: string;
  isLowStock: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  imageUrl: string;
  fileUrl?: string; // Public URL for viewing/downloading the file
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CLARIFICATION';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  status: 'PENDING' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  medicines: OrderMedicine[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderMedicine {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
}

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  pharmacistId?: string;
  pharmacistName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FILLED' | 'DISPATCHED';
  requestedAt: string;
  actionedAt?: string;
  reasonForRejection?: string;
  prescriptionImageUrl?: string; // for modal display
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

export interface RefillDetailItem {
  medicineId: number;
  medicineName: string;
  stock: number;
}

export interface RefillDetailDTO {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  prescriptionImageUrl: string;
  items: RefillDetailItem[];
}

export interface FilledItemInput {
  medicineId: number;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  days: number;
}

export interface FilledMedicineRow {
  medicineId: number;
  medicineName: string;
  timesPerDay: number;
  days: number;
  totalNeeded: number;
}

export interface MedicineFillHistoryEntry {
  id: number;
  prescription: Prescription;
  patientId: string;
  pharmacistId: string;
  filledMedicines: FilledMedicineRow[];
  status: 'FILLED' | 'DISPATCHED';
  fillDate: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isEdited: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'PHARMACIST' | 'ADMIN';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'PATIENT' | 'PHARMACIST';
  phone?: string;
  licenseNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 