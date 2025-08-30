import React, { useState, useEffect } from 'react';
import { Prescription } from '../types';

interface PrescriptionModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ prescription, isOpen, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Set initial image URL when modal opens - MUST be before any conditional returns
  useEffect(() => {
    if (prescription?.fileUrl && prescription.fileUrl.trim() !== '') {
      setCurrentImageUrl(prescription.fileUrl);
      setIsLoading(true);
      setImageError(false);
    } else {
      setCurrentImageUrl('');
      setIsLoading(false);
      setImageError(true);
    }
  }, [prescription?.fileUrl]);

  // Early return after all hooks
  if (!isOpen || !prescription) {
    return null;
  }

  const isImage = prescription.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = prescription.fileUrl?.match(/\.pdf$/i);

  // Generate fallback URLs if the primary URL fails
  const generateFallbackUrls = (primaryUrl: string | undefined): string[] => {
    if (!primaryUrl || primaryUrl.trim() === '') return [];
    
    const filename = primaryUrl.split('/').pop();
    if (!filename) return [];
    
    return [
      primaryUrl, // Original URL
      `http://localhost:8080/files/uploads/${filename}`, // New file controller
      `http://localhost:8080/uploads/${filename}`, // Direct uploads
      `http://localhost:8080/api/prescriptions/file/${filename}` // Prescription controller
    ];
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', currentImageUrl);
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Image failed to load:', currentImageUrl);
    
    // Try fallback URLs
    const fallbackUrls = generateFallbackUrls(prescription.fileUrl);
    const currentIndex = fallbackUrls.indexOf(currentImageUrl);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < fallbackUrls.length) {
      console.log('Trying fallback URL:', fallbackUrls[nextIndex]);
      setCurrentImageUrl(fallbackUrls[nextIndex]);
      setImageError(false);
      setIsLoading(true);
    } else {
      console.error('All fallback URLs failed');
      setIsLoading(false);
      setImageError(true);
    }
  };

  const handleDownload = () => {
    const downloadUrl = currentImageUrl || prescription.fileUrl;
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `prescription_${prescription.id}.${isImage ? 'jpg' : isPdf ? 'pdf' : 'file'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No download URL available');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Prescription #{prescription.id.slice(-8)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Prescription Info */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Patient:</span> {prescription.patientName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Uploaded:</span> {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                prescription.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                prescription.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                prescription.status === 'REQUIRES_CLARIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {prescription.status.replace('_', ' ')}
              </span>
            </p>
            {prescription.notes && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Notes:</span> {prescription.notes}
              </p>
            )}
          </div>

          {/* File Display */}
          <div className="border rounded-lg overflow-hidden">
            {(prescription.fileUrl || currentImageUrl) ? (
              <div>
                {isImage ? (
                  <div className="flex justify-center bg-gray-50 relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <img
                      src={currentImageUrl}
                      alt="Prescription"
                      className={`max-w-full max-h-96 object-contain ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                    {imageError && (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Image could not be loaded</p>
                          <p className="text-xs text-gray-400 mt-1">Try downloading the file instead</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPdf ? (
                  <div className="h-96">
                    <iframe
                      src={currentImageUrl}
                      className="w-full h-full"
                      title="Prescription PDF"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        setIsLoading(false);
                        setImageError(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>File preview not available</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No file available</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-4">
            {(prescription.fileUrl || currentImageUrl) && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title={`Download using: ${currentImageUrl || prescription.fileUrl || 'No URL available'}`}
              >
                Download File
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal; 