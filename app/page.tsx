"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UrlInput from "@/components/UrlInput";
import ParsedPreviewCard from "@/components/ParsedPreviewCard";
import BilagForm, { BilagFormData } from "@/components/BilagForm";
import PDFPreview from "@/components/PDFPreview";

interface ParsedData {
  title: string;
  price: number;
  description: string;
  date: string;
  location: string;
  sellerName?: string;
  sourceUrl: string;
}

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleParseUrl = async (url: string) => {
    setIsParsing(true);
    setParsedData(null);

    try {
      const response = await fetch("/api/parse-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        alert(result.error || "Kunne ikke hente data fra URL");
      }
    } catch (error) {
      console.error("Parse error:", error);
      alert("En feil oppstod ved henting av data");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGeneratePdf = async (
    data: BilagFormData,
    preview: boolean = false
  ) => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Kunne ikke generere PDF";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Server feil: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (preview) {
        // Revoke previous URL if exists
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(url);
      } else {
        // Last ned PDF
        const link = document.createElement("a");
        link.href = url;
        link.download = `kvittering-${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Revoke URL after a short delay to ensure download starts
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "En feil oppstod ved generering av PDF";
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = (data: BilagFormData) => {
    handleGeneratePdf(data, true);
  };

  const handleSubmit = (data: BilagFormData) => {
    handleGeneratePdf(data, false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Generer profesjonelle kvitteringer fra Finn.no-annonser
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Finn Kvittering gjør det enkelt å lage regnskapsbilag og
            kvitteringer direkte fra annonser på Finn.no. Perfekt for
            privatpersoner og småbedrifter som trenger rask dokumentasjon av
            kjøp og salg.
          </p>

          {/* 3-trinns instruksjon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lim inn URL</h3>
              <p className="text-sm text-gray-600">
                Kopier og lim inn lenken til Finn.no-annonsen du har kjøpt eller
                solgt fra
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Fyll ut skjema
              </h3>
              <p className="text-sm text-gray-600">
                Informasjon fra annonsen fylles automatisk inn. Du kan justere
                og legge til detaljer
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Last ned PDF</h3>
              <p className="text-sm text-gray-600">
                Generer og last ned et profesjonelt A4-regnskapsbilag klar for
                printing
              </p>
            </div>
          </div>
        </section>

        {/* Main Form Section */}
        <section className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Lag kvittering
          </h2>

          <div className="mb-6">
            <UrlInput onParse={handleParseUrl} isLoading={isParsing} />
          </div>

          {parsedData && <ParsedPreviewCard data={parsedData} />}

          <BilagForm
            initialData={
              parsedData
                ? {
                    title: parsedData.title,
                    price: parsedData.price,
                    sellerName: parsedData.sellerName || "",
                    location: parsedData.location,
                    sourceUrl: parsedData.sourceUrl,
                    date: parsedData.date,
                    notes: parsedData.description
                      ? `Finn beskrivelse:\n\n${parsedData.description}`
                      : undefined,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onPreview={handlePreview}
            isLoading={isGenerating}
          />
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Ofte stilte spørsmål
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Hva er Finn Kvittering?
              </h3>
              <p className="text-gray-600">
                Finn Kvittering er en tjeneste som hjelper deg med å generere
                profesjonelle kvitteringer og regnskapsbilag basert på annonser
                fra Finn.no. Tjenesten henter automatisk informasjon fra
                annonsen og lar deg fylle ut resten av detaljene før du
                genererer et printklart PDF-dokument.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Er kvitteringene gyldige for regnskapsføring?
              </h3>
              <p className="text-gray-600">
                Ja, kvitteringene generert av Finn Kvittering er
                egendokumentasjon i henhold til bokføringsforskriften §5-5. De
                inneholder alle nødvendige felter for regnskapsføring og kan
                brukes som dokumentasjon for kjøp og salg.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Lagres dataene mine?
              </h3>
              <p className="text-gray-600">
                Nei, alle data behandles lokalt i nettleseren din. Vi lagrer
                ingen personopplysninger, transaksjonsdata eller annonser.
                PDF-filer genereres på forespørsel og lastes ned direkte til din
                enhet uten lagring på våre servere.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Fungerer det med alle Finn.no-annonser?
              </h3>
              <p className="text-gray-600">
                Tjenesten fungerer best med aktive annonser på Finn.no. Hvis en
                annonse er blokkert for automatisk henting eller krever
                innlogging, kan du fortsatt fylle ut skjemaet manuelt med
                informasjonen du har.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Kan jeg bruke dette for flere transaksjoner?
              </h3>
              <p className="text-gray-600">
                Ja, du kan bruke tjenesten så mange ganger du vil. Hver
                kvittering får et unikt bilagsnummer, og du kan generere så
                mange dokumenter du trenger.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Hva koster tjenesten?
              </h3>
              <p className="text-gray-600">
                Finn Kvittering er gratis å bruke. Du kan generere så mange
                kvitteringer du trenger uten kostnad eller registrering.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {previewUrl && (
        <PDFPreview
          pdfUrl={previewUrl}
          onClose={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
}
