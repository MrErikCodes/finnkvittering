import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

interface GeneratePdfRequest {
  date: string;
  price: number;
  sellerName: string;
  buyerName: string;
  paymentMethod: string;
  location?: string;
  notes?: string;
  sourceUrl?: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePdfRequest = await request.json();

    // Validering
    if (
      !body.date ||
      !body.price ||
      !body.sellerName ||
      !body.buyerName ||
      !body.paymentMethod
    ) {
      return NextResponse.json(
        { error: "Påkrevde felter mangler" },
        { status: 400 }
      );
    }

    // Generer bilagsnummer basert på source URL eller tilfeldig nummer
    const generateBilagsnummer = (sourceUrl?: string): string => {
      if (sourceUrl) {
        // Prøv å hente finnkode fra URL (f.eks. finnkode=123456)
        const finnkodeMatch = sourceUrl.match(/finnkode=(\d+)/i);
        if (finnkodeMatch && finnkodeMatch[1]) {
          return `FK-${finnkodeMatch[1]}`;
        }

        // Prøv å hente tall fra slutten av URL-en
        const numberMatch = sourceUrl.match(/(\d{6,})/);
        if (numberMatch && numberMatch[1]) {
          return `FK-${numberMatch[1].substring(0, 6)}`;
        }

        // Prøv å hente hvilket som helst tall fra URL-en
        const anyNumberMatch = sourceUrl.match(/(\d+)/);
        if (anyNumberMatch && anyNumberMatch[1]) {
          const num = anyNumberMatch[1].substring(0, 6);
          return `FK-${num.padStart(6, "0")}`;
        }
      }

      // Fallback: generer tilfeldig 6-sifret nummer
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `FK-${randomNum}`;
    };

    const bilagsnummer = generateBilagsnummer(body.sourceUrl);
    const generatedAt = new Date().toISOString();

    // Formater dato til norsk format
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("no-NO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return dateString;
      }
    };

    // Generer HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kvittering / Regnskapsbilag</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      padding: 25px;
      background: #fff;
      display: flex;
      flex-direction: column;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .header {
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .site-name {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 5px;
    }
    .document-title {
      font-size: 14px;
      color: #333;
      font-weight: normal;
    }
    .bilagsinfo {
      background: #e6f2ff;
      padding: 10px;
      margin-bottom: 15px;
      border-left: 3px solid #0066cc;
    }
    .bilagsinfo p {
      margin: 3px 0;
      font-size: 10pt;
    }
    .section {
      margin-bottom: 12px;
    }
    .section h3 {
      font-size: 14px;
      margin-bottom: 8px;
      color: #0066cc;
      font-weight: bold;
    }
    .field-row {
      margin-bottom: 8px;
    }
    .field-label {
      font-weight: bold;
      margin-bottom: 2px;
      color: #333;
      font-size: 10pt;
    }
    .field-value {
      border-bottom: 1px solid #0066cc;
      min-height: 16px;
      padding-bottom: 1px;
      color: #000;
      font-size: 10pt;
    }
    .field-value-full {
      border-bottom: 1px solid #0066cc;
      min-height: 16px;
      margin-top: 3px;
      padding-bottom: 1px;
      font-size: 10pt;
    }
    .info-section {
      background: #f0f8ff;
      padding: 10px;
      margin-top: 12px;
      margin-bottom: 12px;
      border-left: 3px solid #0066cc;
    }
    .info-section h3 {
      font-size: 12px;
      margin-bottom: 6px;
      color: #0066cc;
      font-weight: bold;
    }
    .info-section p {
      font-size: 9pt;
      line-height: 1.4;
      margin-bottom: 0;
      color: #333;
    }
    .signature-section {
      margin-top: auto;
      padding-top: 20px;
    }
    .signature-title {
      font-size: 12px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 8px;
    }
    .signature-box {
      width: 100%;
      border-top: 2px solid #0066cc;
      padding-top: 6px;
      margin-top: 8px;
      min-height: 40px;
    }
    .signature-label {
      font-size: 9pt;
      color: #666;
      margin-bottom: 3px;
    }
    .signature-note {
      font-size: 8pt;
      color: #666;
      font-style: italic;
      margin-top: 5px;
    }
    .tips-section {
      background: #fff9e6;
      padding: 8px;
      margin-top: 12px;
      border-left: 3px solid #ffa500;
      font-size: 9pt;
      color: #333;
    }
    .footer {
      margin-top: auto;
      padding-top: 10px;
      border-top: 2px solid #0066cc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="header">
      <div class="site-name">Finn Kvittering</div>
      <div class="document-title">Regnskapsbilag for kjøp via Finn.no</div>
    </div>

    <div class="bilagsinfo">
      <p><strong>Bilagsnummer:</strong> ${bilagsnummer}</p>
      <p><strong>Generert:</strong> ${formatDate(generatedAt)}</p>
    </div>

    <div class="section">
      <h3>Kjøpsdetaljer:</h3>
      <div class="field-row">
        <div class="field-label">Dato for kjøp:</div>
        <div class="field-value">${formatDate(body.date)}</div>
      </div>
      ${
        body.title
          ? `<div class="field-row">
        <div class="field-label">Hva:</div>
        <div class="field-value">${escapeHtml(body.title)}</div>
      </div>`
          : ""
      }
      <div class="field-row">
        <div class="field-label">Pris:</div>
        <div class="field-value">NOK ${formatPrice(body.price)},-</div>
      </div>
      <div class="field-row">
        <div class="field-label">Betalingsmåte:</div>
        <div class="field-value">${escapeHtml(body.paymentMethod.trim())}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Selger:</div>
        <div class="field-value">${escapeHtml(body.sellerName)}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Kjøper:</div>
        <div class="field-value">${escapeHtml(body.buyerName)}</div>
      </div>
      ${
        body.location
          ? `<div class="field-row">
        <div class="field-label">Sted:</div>
        <div class="field-value">${escapeHtml(body.location)}</div>
      </div>`
          : ""
      }
      ${
        body.sourceUrl
          ? `<div class="field-row">
        <div class="field-label">Finn.no annonse:</div>
        <div class="field-value">${escapeHtml(body.sourceUrl)}</div>
      </div>`
          : ""
      }
      ${
        body.notes
          ? `<div class="field-row">
        <div class="field-label">Kommentarer:</div>
        <div class="field-value-full" style="white-space: pre-wrap;">${escapeHtml(
          body.notes
        )}</div>
      </div>`
          : ""
      }
    </div>

    <div class="signature-section">
      <div class="signature-title">Signatur av selger: <span style="font-size: 9pt; font-weight: normal; color: #666;">(Valgfritt)</span></div>
      <div class="signature-box">
        
        <div class="signature-note">Dato: ${formatDate(body.date)}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Generert med FinnKvittering.no – gratis bilaggenerator for Finn.no kjøp</p>
    <p style="margin-top: 8px; font-size: 7pt; line-height: 1.3;">
      Dette bilaget er laget for å oppfylle kravene til egendokumentasjon ved kjøp mellom næringsdrivende og privatpersoner, i henhold til bokføringsforskriften §5-5. Bilaget inneholder all nødvendig informasjon om transaksjonen og kan brukes som grunnlag for regnskapsføring.
    </p>
    <p style="margin-top: 6px; font-size: 7pt; font-style: italic;">
      Tips: Skjermbilde av betalingstransaksjonen kan legges ved dette bilaget for ekstra dokumentasjon.
    </p>
  </div>
</body>
</html>
    `;

    // Generer PDF med Puppeteer
    let browser;
    let page;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
        ],
      });

      page = await browser.newPage();

      // Sett viewport størrelse først
      await page.setViewport({ width: 794, height: 1123 }); // A4 i pixels (72 DPI)

      await page.setContent(htmlContent, {
        waitUntil: "load",
        timeout: 30000,
      });

      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
        preferCSSPageSize: false,
        timeout: 30000,
      });

      // Close page and browser before returning response
      await page.close().catch(() => {});
      await browser.close().catch(() => {});

      // Returner PDF som binary
      return new Response(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="kvittering-${bilagsnummer}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (puppeteerError) {
      // Ensure cleanup on error
      if (page) {
        await page.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw puppeteerError;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "En feil oppstod ved generering av PDF";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  if (!text) return "";
  const trimmed = String(text).trim();
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return trimmed.replace(/[&<>"']/g, (m) => map[m]);
}

function formatPrice(price: number): string {
  // Formater med mellomrom som tusenskiller (f.eks. 35 000)
  return new Intl.NumberFormat("no-NO", {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
