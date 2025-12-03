import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          Finn Kvittering
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          Generer profesjonelle kvitteringer og regnskapsbilag fra Finn.no-annonser
        </p>
      </div>
    </header>
  );
}

