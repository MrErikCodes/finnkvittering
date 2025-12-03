import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface ParseUrlResponse {
  success: boolean;
  data?: {
    title: string;
    price: number;
    description: string;
    date: string;
    location: string;
    images: string[];
    sellerName?: string;
    sourceUrl: string;
  };
  warnings?: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL er påkrevd" },
        { status: 400 }
      );
    }

    // Valider at URL er fra Finn.no eller lignende
    const finnPattern = /^https?:\/\/(www\.)?(finn\.no|finn\.no\/.*)/i;
    if (!finnPattern.test(url)) {
      return NextResponse.json(
        {
          success: false,
          error: "URL må være fra Finn.no",
          warnings: ["Kun Finn.no-URLer støttes for øyeblikket"],
        },
        { status: 400 }
      );
    }

    const warnings: string[] = [];

    try {
      // Hent HTML fra Finn.no
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "no-NO,no;q=0.9",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse tittel
      const titleSelector1 = $('h1[data-testid="ad-title"]');
      const titleSelector2 = $("h1").first();
      const titleSelector3 = $("title");

      const title =
        titleSelector1.text().trim() ||
        titleSelector2.text().trim() ||
        titleSelector3.text().trim() ||
        "";

      // Parse pris
      // Prioritize h2 with data-testid="price" (used for car listings)
      const priceSelector1 = $('h2[data-testid="price"]');
      const priceSelector2 = $('[data-testid="price"]');
      const priceSelector3 = $(".u-t3");
      const priceSelector4 = $(".h2");
      // Look for elements containing "kr" that likely contain the price
      const priceSelector5 = $("*")
        .filter((_, el) => {
          const text = $(el).text();
          return /\d+\s*kr/i.test(text) && $(el).children().length === 0;
        })
        .first();

      const priceText =
        priceSelector1.text().trim() ||
        priceSelector2.text().trim() ||
        priceSelector3.text().trim() ||
        priceSelector4.text().trim() ||
        priceSelector5.text().trim() ||
        "";

      // Extract price - handle both regular spaces and non-breaking spaces (&nbsp; or \u00A0)
      // Match digits and any whitespace (including non-breaking spaces) before "kr"
      let price = 0;
      const priceWithKr = priceText.match(/([\d\s\u00A0]+)\s*kr/i);
      if (priceWithKr && priceWithKr[1]) {
        // Extract number from "4 500 kr" format
        price = parseInt(priceWithKr[1].replace(/[\s\u00A0]/g, ""), 10);
      } else {
        // Fallback: match any sequence of digits and spaces
        const priceMatch = priceText.match(/[\d\s\u00A0]+/);
        if (priceMatch) {
          price = parseInt(priceMatch[0].replace(/[\s\u00A0]/g, ""), 10);
        }
      }

      // Parse beskrivelse
      const descSelector1 = $('[data-testid="ad-description"]');
      const descSelector2 = $(".about-section-default .whitespace-pre-wrap");
      const descSelector3 = $(".whitespace-pre-wrap");
      const descSelector4 = $(".object-description");
      const description =
        descSelector1.text().trim() ||
        descSelector2.text().trim() ||
        descSelector3.text().trim() ||
        descSelector4.text().trim() ||
        "";

      // Parse lokasjon
      const locSelector1 = $('[data-testid="location"]');
      const locSelector2 = $(".u-mt16").first();
      const location =
        locSelector1.text().trim() || locSelector2.text().trim() || "";

      // Parse bilder
      const images: string[] = [];
      const imageElements = $('img[data-testid="ad-image"]');
      imageElements.each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && !images.includes(src)) {
          images.push(
            src.startsWith("http") ? src : `https://www.finn.no${src}`
          );
        }
      });

      // Parse selger (kan være vanskelig å finne)
      const sellerSelector1 = $('[data-testid="seller-name"]');
      const sellerSelector2 = $(".profile-name");
      const sellerName =
        sellerSelector1.text().trim() || sellerSelector2.text().trim() || "";

      // Parse dato (publiseringsdato)
      const dateSelector1 = $('[data-testid="published-date"]');
      const dateSelector2 = $(".u-mt16").last();
      const dateText =
        dateSelector1.text().trim() || dateSelector2.text().trim() || "";
      const date = dateText || new Date().toISOString().split("T")[0];

      const parsedData = {
        title: title || "",
        price: price || 0,
        description: description || "",
        date: date || new Date().toISOString().split("T")[0],
        location: location || "",
        images: images.slice(0, 5), // Begrens til 5 bilder
        sellerName: sellerName || "",
        sourceUrl: url,
      };

      return NextResponse.json({
        success: true,
        data: parsedData,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch {
      // Hvis scraping feiler, returner mock-data med advarsel
      warnings.push(
        "Kunne ikke hente data automatisk fra annonsen. Dette kan skyldes at annonsen krever innlogging eller at scraping er blokkert. Du kan fylle ut feltene manuelt."
      );

      return NextResponse.json({
        success: true,
        data: {
          title: "",
          price: 0,
          description: "",
          date: new Date().toISOString().split("T")[0],
          location: "",
          images: [],
          sellerName: "",
          sourceUrl: url,
        },
        warnings,
      });
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "En feil oppstod ved parsing av URL",
      },
      { status: 500 }
    );
  }
}
