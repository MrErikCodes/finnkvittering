'use client';

import { useState } from 'react';

interface UrlInputProps {
  onParse: (url: string) => void;
  isLoading?: boolean;
}

export default function UrlInput({ onParse, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Vennligst lim inn en Finn.no-URL');
      return;
    }

    const finnPattern = /^https?:\/\/(www\.)?(finn\.no|finn\.no\/.*)/i;
    if (!finnPattern.test(url)) {
      setError('URL må være fra Finn.no');
      return;
    }

    onParse(url);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Lim inn Finn.no-URL her..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Henter...' : 'Hent data'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}

