export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Om Finn Kvittering</h3>
            <p className="text-sm text-gray-600">
              Finn Kvittering hjelper deg med å generere profesjonelle kvitteringer og regnskapsbilag 
              direkte fra Finn.no-annonser. Perfekt for privatpersoner og småbedrifter som trenger 
              rask dokumentasjon av kjøp og salg.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Personvern</h3>
            <p className="text-sm text-gray-600">
              Alle data behandles lokalt i nettleseren din. Vi lagrer ingen personopplysninger, 
              transaksjonsdata eller annonser. PDF-filer genereres på forespørsel og lastes ned 
              direkte til din enhet. Vi bruker ikke cookies eller sporingsteknologi.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Kontakt</h3>
            <p className="text-sm text-gray-600">
              Har du spørsmål eller tilbakemeldinger? Vi setter pris på din input for å forbedre 
              tjenesten vår.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Finn Kvittering. Alle rettigheter forbeholdt.</p>
        </div>
      </div>
    </footer>
  );
}

