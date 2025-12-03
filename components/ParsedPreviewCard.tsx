"use client";

export default function ParsedPreviewCard() {
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
          <p className="text-sm text-green-700">
            Informasjon fra annonsen er hentet. Du kan nå fylle ut skjemaet
            nedenfor.
          </p>
        </div>
      </div>
    </div>
  );
}
