"use client";

interface ParsedData {
  title: string;
  price: number;
  description: string;
  date: string;
  location: string;
  sellerName?: string;
  sourceUrl: string;
}

interface ParsedPreviewCardProps {
  data: ParsedData;
}

export default function ParsedPreviewCard({ data }: ParsedPreviewCardProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-1">Data hentet!</h3>
          <p className="text-sm text-green-700 mb-3">
            Informasjon fra annonsen er hentet. Du kan nå fylle ut skjemaet
            nedenfor.
          </p>

          {/* Display parsed data */}
          <div className="bg-white rounded p-4 mb-3">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Tittel:</span>{" "}
                <span className="text-gray-900">{data.title}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Pris:</span>{" "}
                <span className="text-gray-900">
                  {data.price.toLocaleString("no-NO")} kr
                </span>
              </div>
              {data.sellerName && (
                <div>
                  <span className="font-semibold text-gray-700">Selger:</span>{" "}
                  <span className="text-gray-900">{data.sellerName}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700">Lokasjon:</span>{" "}
                <span className="text-gray-900">{data.location}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Dato:</span>{" "}
                <span className="text-gray-900">{data.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
