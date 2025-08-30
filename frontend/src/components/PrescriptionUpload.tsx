import React, { useState } from 'react';
import { Prescription } from '../types';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PrescriptionUploadProps {
  onUpload: (prescription: Prescription) => void;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid file type (JPEG, PNG, or PDF)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload a prescription');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      console.log('Uploading prescription for user:', user.email);
      const prescription = await apiService.uploadPrescription(file);
      console.log('Upload successful, prescription:', prescription);
      
      // Transform the response to match our frontend type
      const transformedPrescription: Prescription = {
        id: prescription.id,
        patientId: prescription.patientId || '',
        patientName: prescription.patientName || '',
        imageUrl: prescription.imageUrl || '',
        fileUrl: prescription.fileUrl || '', // Include the new fileUrl
        status: prescription.status || 'PENDING',
        notes: prescription.notes || '',
        createdAt: prescription.createdAt || new Date().toISOString(),
        updatedAt: prescription.updatedAt || new Date().toISOString()
      };
      
      onUpload(transformedPrescription);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload prescription');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="prescription-file" className="block text-sm font-medium text-gray-700 mb-2">
          Select Prescription File
        </label>
        <input
          id="prescription-file"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          className="input-field"
          disabled={isUploading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Accepted formats: JPEG, PNG, PDF (max 5MB)
        </p>
      </div>

      {file && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            Selected file: {file.name}
          </p>
          <p className="text-xs text-gray-500">
            Size: {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="btn-primary w-full"
      >
        {isUploading ? 'Uploading...' : 'Upload Prescription'}
      </button>
    </div>
  );
};

export default PrescriptionUpload; 