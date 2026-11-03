const fs = require('fs');
const { execSync } = require('child_process');

const SHEET_ID = '1KFQ8WY4NNFAnPuzMYwKnJW9GyvmuPYFfLyk2u8If5AU';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

console.log('Downloading CSV from Google Sheets...');
const csv = execSync(`curl -sL "${SHEET_URL}"`).toString();

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line considering quotes
    const cells = [];
    let cur = '';
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        cells.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim().replace(/^"|"$/g, ''));

    if (cells.length >= 2) {
      const rawName = cells[0] || '';
      const siteId = cells[1] || '';
      const nop = cells[7] || 'DEPOTEL SITE';

      if (siteId && siteId !== 'Site ID' && !seen.has(siteId.toUpperCase())) {
        seen.add(siteId.toUpperCase());
        const cleanName = rawName.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        const siteName = cleanName ? `${siteId}_${cleanName}` : siteId;
        result.push({
          siteId,
          siteName,
          fullText: siteName,
          region: nop,
          defaultTeam: '',
          technicianName: ''
        });
      }
    }
  }
  return result;
}

const parsedSites = parseCSV(csv);
console.log(`Successfully parsed ${parsedSites.length} real sites from Google Sheet ID ${SHEET_ID}`);

const tsContent = `export interface DepotelSiteEntry {
  siteId: string;
  siteName: string;
  fullText: string;
  region: string;
  defaultTeam?: string;
  technicianName?: string;
}

export const GOOGLE_SHEET_ID = "${SHEET_ID}";
export const GOOGLE_SHEET_CSV_URL = "${SHEET_URL}";

export const DEPOTEL_2380_SITES_DATABASE: DepotelSiteEntry[] = ${JSON.stringify(parsedSites, null, 2)};

/**
 * High-performance search function for 2,380+ sites database.
 * Returns up to 80 matching results instantly for auto-search.
 */
export function searchDepotelSites(query: string, limit: number = 80): DepotelSiteEntry[] {
  if (!query || !query.trim()) {
    return DEPOTEL_2380_SITES_DATABASE.slice(0, limit);
  }

  const q = query.toLowerCase().trim();
  const results: DepotelSiteEntry[] = [];

  for (let i = 0; i < DEPOTEL_2380_SITES_DATABASE.length; i++) {
    const entry = DEPOTEL_2380_SITES_DATABASE[i];

    if (
      entry.siteId.toLowerCase().includes(q) ||
      entry.siteName.toLowerCase().includes(q) ||
      entry.fullText.toLowerCase().includes(q) ||
      (entry.region && entry.region.toLowerCase().includes(q))
    ) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Live async fetcher from Google Sheet ID 1KFQ8WY4NNFAnPuzMYwKnJW9GyvmuPYFfLyk2u8If5AU
 */
export async function fetchLiveGoogleSheetSites(): Promise<DepotelSiteEntry[]> {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) return DEPOTEL_2380_SITES_DATABASE;
    const text = await response.text();
    const lines = text.split(/\\r?\\n/);
    const result: DepotelSiteEntry[] = [];
    const seen = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = line.split(",");
      if (cells.length >= 2) {
        const rawName = cells[0].replace(/"/g, "").trim();
        const siteId = cells[1].replace(/"/g, "").trim();
        const nop = cells[7] ? cells[7].replace(/"/g, "").trim() : "DEPOTEL SITE";

        if (siteId && siteId !== "Site ID" && !seen.has(siteId.toUpperCase())) {
          seen.add(siteId.toUpperCase());
          const siteName = rawName ? \`\${siteId}_\${rawName}\` : siteId;
          result.push({
            siteId,
            siteName,
            fullText: siteName,
            region: nop,
            defaultTeam: "",
            technicianName: ""
          });
        }
      }
    }
    return result.length > 0 ? result : DEPOTEL_2380_SITES_DATABASE;
  } catch (e) {
    console.warn("Using fallback bundled 2,380 sites dataset", e);
    return DEPOTEL_2380_SITES_DATABASE;
  }
}
`;

fs.writeFileSync('src/data/depotelDatabase.ts', tsContent, 'utf-8');
console.log('Saved src/data/depotelDatabase.ts successfully!');
