'use client';

import { useState, useEffect } from 'react';

interface PDFPreviewProps {
  pdfUrl: string | null;
  onClose: () => void;
}

export default function PDFPreview({ pdfUrl, onClose }: PDFPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pdfUrl) {
      setLoading(true);
      setError(false);
    }
  }, [pdfUrl]);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Forhåndsvisning av kvittering</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Lukk"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {loading && !error && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-red-600 mb-4">Kunne ikke laste PDF</p>
              <a
                href={pdfUrl}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Last ned PDF i stedet
              </a>
            </div>
          )}
          {!error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[600px] border border-gray-300 rounded"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              title="PDF Preview"
              style={{ display: loading ? 'none' : 'block' }}
            />
          )}
        </div>
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <a
            href={pdfUrl}
            download
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Last ned PDF
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}

