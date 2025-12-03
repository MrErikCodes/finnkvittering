import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

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

      // Write HTML to file for debugging
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `finn-html-${timestamp}.html`;
        const filepath = path.join(process.cwd(), filename);
        fs.writeFileSync(filepath, html, "utf-8");
        console.log(`📄 HTML saved to: ${filename}`);
      } catch (fileError) {
        console.error("Failed to save HTML file:", fileError);
      }

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
      const locSelector2 = $('[data-testid="object-address"]');
      const locSelector3 = $(".u-mt16").first();
      const location =
        locSelector1.text().trim() ||
        locSelector2.text().trim() ||
        locSelector3.text().trim() ||
        "";

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
      // Try multiple selectors to find seller name
      const sellerSelector1 = $('[data-testid="seller-name"]');
      const sellerSelector2 = $(".profile-name");

      // Method 1: Extract from profile image alt text (e.g., "Profilbilde for Kristin Granlund")
      // Check ALL images - the profile section might be loaded dynamically
      const allImages = $("img");
      const profileImages = allImages.filter((_, el) => {
        const alt = $(el).attr("alt") || "";
        const src = $(el).attr("src") || "";
        // Check if alt contains "profilbilde" or "for" (common pattern)
        // Also check src for profilbilde path
        return (
          alt.toLowerCase().includes("profilbilde") ||
          src.toLowerCase().includes("profilbilde") ||
          (alt.toLowerCase().includes("for") &&
            alt.length > 10 &&
            alt.length < 100) // Might be "Profilbilde for Name"
        );
      });

      // Method 2: Find "På FINN siden" text and look for seller name nearby
      const finnSidenText = $("*").filter((_, el) => {
        const text = $(el).text();
        return /på finn siden/i.test(text);
      });

      // Search ALL links first, then filter manually (cheerio class selectors can be unreliable)
      const allLinks = $("a");

      // Very direct check: Links with t4 class that have profile hrefs
      const directT4ProfileLinks = allLinks.filter((_, el) => {
        const classes = $(el).attr("class") || "";
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();
        const hasT4Class =
          classes.includes("t4") || classes.includes("leading-ml");
        const isProfileLink =
          href.includes("/profile/ads") ||
          (href.includes("/profile") && href.includes("userId"));
        return Boolean(
          hasT4Class &&
            isProfileLink &&
            text.length > 1 &&
            text.length < 100 &&
            /[a-zA-ZæøåÆØÅ]/.test(text)
        );
      });

      // Direct check: Links with t4/leading-ml class AND profile href
      const directSellerLinks = allLinks.filter((_, el) => {
        const classes = $(el).attr("class") || "";
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();
        const hasTypographyClass =
          classes.includes("t4") || classes.includes("leading-ml");
        const isProfileLink =
          href.includes("/profile/ads") ||
          (href.includes("/profile") && href.includes("userId"));
        return Boolean(
          hasTypographyClass &&
            isProfileLink &&
            text.length > 0 &&
            text.length < 100 &&
            /[a-zA-ZæøåÆØÅ]/.test(text)
        );
      });

      // Look for links to profile pages
      const profileLinks = allLinks.filter((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();
        const isProfileLink =
          (href.includes("/profile/ads") || href.includes("/profile")) &&
          (href.includes("userId") || href.includes("profile"));
        return Boolean(
          isProfileLink &&
            text.length > 0 &&
            text.length < 100 &&
            /[a-zA-ZæøåÆØÅ]/.test(text)
        );
      });

      // Look for anchor tags with typography classes (t4, t5)
      const typographyLinks = allLinks.filter((_, el) => {
        const classes = $(el).attr("class") || "";
        const text = $(el).text().trim();
        const hasTypographyClass =
          classes.includes("t4") || classes.includes("leading-ml");
        return Boolean(
          hasTypographyClass && text.length > 2 && text.length < 100
        );
      });

      // Look for text near "Verifisert med BankID" or similar verification text
      const verificationText = $("*").filter((_, el) => {
        const text = $(el).text();
        return Boolean(/verifisert/i.test(text) || /bankid/i.test(text));
      });

      let sellerName = "";

      // Priority 0: Extract from profile image alt text (most reliable!)
      // Format: "Profilbilde for Kristin Granlund"
      // Also check ALL images in case profile section is loaded dynamically
      if (profileImages.length > 0) {
        for (let i = 0; i < profileImages.length; i++) {
          const image = profileImages.eq(i);
          const altText = image.attr("alt") || "";

          // Try multiple patterns to extract the name
          let nameMatch = altText.match(/profilbilde for (.+)/i);
          if (!nameMatch) {
            nameMatch = altText.match(/profilbilde\s+(.+)/i);
          }
          if (!nameMatch && altText.toLowerCase().includes("for")) {
            // Try extracting name after "for" in any context
            nameMatch = altText.match(
              /for\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+)/
            );
          }

          if (nameMatch && nameMatch[1]) {
            sellerName = nameMatch[1].trim();
            sellerName = sellerName.split(/[,\n\r]/)[0].trim();
            break;
          }
        }
      }

      // Also check ALL images for any alt text containing "for" + name pattern
      if (!sellerName) {
        allImages.each((_, el) => {
          const altText = $(el).attr("alt") || "";
          if (
            altText.length > 10 &&
            altText.length < 100 &&
            altText.toLowerCase().includes("for")
          ) {
            const nameMatch = altText.match(
              /for\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+)/
            );
            if (nameMatch && nameMatch[1]) {
              sellerName = nameMatch[1].trim();
              return false; // break
            }
          }
        });
      }

      // Priority 1: Standard testid selectors
      if (
        !sellerName &&
        sellerSelector1.length &&
        sellerSelector1.text().trim()
      ) {
        sellerName = sellerSelector1.text().trim();
        console.log("  ✅ Found via Priority 1 (testid):", sellerName);
      }
      // Priority 2: Profile name class
      else if (sellerSelector2.length && sellerSelector2.text().trim()) {
        sellerName = sellerSelector2.text().trim();
        console.log(
          "  ✅ Found via Priority 2 (profile-name class):",
          sellerName
        );
      }
      // Priority 2.5: Find seller name near "På FINN siden" text
      if (!sellerName && finnSidenText.length > 0) {
        // Look for links or text in the same parent container
        const parent = finnSidenText.first().parent();
        const links = parent.find("a");
        console.log(
          `  Checking parent of "På FINN siden": found ${links.length} links`
        );
        links.each((i, el) => {
          const linkText = $(el).text().trim();
          const href = $(el).attr("href") || "";
          const classes = $(el).attr("class") || "";
          console.log(
            `    Link ${i}: text="${linkText}", href="${href}", classes="${classes}"`
          );
          // If it looks like a name and is near profile content
          if (
            linkText.length > 2 &&
            linkText.length < 100 &&
            /[a-zA-ZæøåÆØÅ]/.test(linkText) &&
            (href.includes("profile") ||
              classes.includes("t4") ||
              classes.includes("leading-ml"))
          ) {
            sellerName = linkText;
            console.log("  ✅ Found via 'På FINN siden' context:", sellerName);
            return false; // break
          }
        });
      }

      // Priority 3: Very direct t4 class + profile href (exact pattern match)
      else if (!sellerName && directT4ProfileLinks.length > 0) {
        const firstLink = directT4ProfileLinks.first();
        const linkText = firstLink.text().trim();
        if (/[a-zA-ZæøåÆØÅ]/.test(linkText) && linkText.length > 1) {
          sellerName = linkText;
        }
      }
      // Priority 4: Direct seller links (t4/leading-ml class + profile href)
      else if (!sellerName && directSellerLinks.length > 0) {
        const firstLink = directSellerLinks.first();
        const linkText = firstLink.text().trim();
        if (/[a-zA-ZæøåÆØÅ]/.test(linkText) && linkText.length > 1) {
          sellerName = linkText;
        }
      }
      // Priority 5: Profile links (fallback)
      else if (!sellerName && profileLinks.length > 0) {
        const firstLink = profileLinks.first();
        const linkText = firstLink.text().trim();
        if (/[a-zA-ZæøåÆØÅ]/.test(linkText) && linkText.length > 1) {
          sellerName = linkText;
        }
      }
      // Priority 6: Typography links (t4 class, leading-ml) - these often contain seller names
      if (!sellerName && typographyLinks.length > 0) {
        // Try to find the link that's most likely to be a seller name
        // Prefer links that are near profile-related content
        for (let i = 0; i < typographyLinks.length; i++) {
          const link = typographyLinks.eq(i);
          const linkText = link.text().trim();
          const href = link.attr("href") || "";

          // If it's a profile link, use it immediately
          if (
            href.includes("profile") &&
            /[a-zA-ZæøåÆØÅ]/.test(linkText) &&
            linkText.length > 1
          ) {
            sellerName = linkText;
            break;
          }
        }
        // If no profile link found, use the first typography link that looks like a name
        // Check if it looks like a proper name (two words starting with capital letters)
        if (!sellerName) {
          for (let i = 0; i < typographyLinks.length; i++) {
            const link = typographyLinks.eq(i);
            const linkText = link.text().trim();
            // Check if it looks like a name (two words, starts with capital)
            if (
              /[a-zA-ZæøåÆØÅ]/.test(linkText) &&
              linkText.length > 2 &&
              linkText.length < 100 &&
              /\s/.test(linkText) // Contains space (likely a full name)
            ) {
              sellerName = linkText;
              break;
            }
          }
          // Last resort: use first typography link if it has reasonable text
          if (!sellerName) {
            const firstLink = typographyLinks.first();
            const linkText = firstLink.text().trim();
            if (/[a-zA-ZæøåÆØÅ]/.test(linkText) && linkText.length > 1) {
              sellerName = linkText;
            }
          }
        }
      }
      // Priority 5: Text near verification badges
      else if (verificationText.length > 0) {
        const parent = verificationText.first().parent();
        const links = parent.find("a");
        if (links.length > 0) {
          const linkText = links.first().text().trim();
          if (
            /[a-zA-ZæøåÆØÅ]/.test(linkText) &&
            linkText.length > 2 &&
            linkText.length < 100
          ) {
            sellerName = linkText;
          }
        }
      }

      // Clean up seller name (remove extra whitespace and newlines)
      sellerName = sellerName.replace(/\s+/g, " ").trim();

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
