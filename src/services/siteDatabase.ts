export interface MasterSite {
  siteId: string;
  siteName: string;
  siteOwner?: string;
  province?: string;
  city?: string;
  area?: string;
  regional?: string;
  nop?: string;
  cluster?: string;
  subdistrict?: string; // Kecamatan
  village?: string;     // Kelurahan
  typeSite?: string;
  siteClass?: string;
  active?: boolean;
  lastMaintenanceSite?: string;
  gensetType?: string;
  gensetCapacity?: string;
  lastMaintenanceGenset?: string;
  lat?: number;
  lng?: number;
}

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1KFQ8WY4NNFAnPuzMYwKnJW9GyvmuPYFfLyk2u8If5AU/export?format=csv';

let memoryCache: MasterSite[] | null = null;

/**
 * Parses raw CSV line handling quoted comma fields cleanly
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV string
 */
export function parseSiteCsv(csvText: string): MasterSite[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const sites: MasterSite[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 2) continue;

    const rawSiteName = row[0] || '';
    const rawSiteId = row[1] || '';

    if (!rawSiteId && !rawSiteName) continue;

    const latStr = row[26] || row[14] || '';
    const lngStr = row[25] || row[13] || '';

    const latNum = parseFloat(latStr.replace(',', '.'));
    const lngNum = parseFloat(lngStr.replace(',', '.'));

    sites.push({
      siteId: rawSiteId.trim().toUpperCase() || rawSiteName.trim().toUpperCase(),
      siteName: rawSiteName.trim().toUpperCase(),
      siteOwner: row[2] || '',
      province: row[3] || '',
      city: row[4] || '',
      area: row[5] || '',
      regional: row[6] || '',
      nop: row[7] || '',
      cluster: row[8] || '',
      subdistrict: row[9] || '',  // Kecamatan
      village: row[10] || '',    // Kelurahan
      typeSite: row[11] || '',
      siteClass: row[17] || '',
      active: row[18] === 'TRUE',
      lastMaintenanceSite: row[19] || '',
      gensetType: row[20] || '',
      gensetCapacity: row[22] || '',
      lastMaintenanceGenset: row[23] || '',
      lat: !isNaN(latNum) && latNum !== 0 ? latNum : undefined,
      lng: !isNaN(lngNum) && lngNum !== 0 ? lngNum : undefined,
    });
  }

  return sites;
}

/**
 * Fetches sites from server API or directly from Google Sheet / Local CSV
 */
export async function fetchSiteDatabase(): Promise<MasterSite[]> {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  try {
    const serverRes = await fetch('/api/sites');
    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json.success && Array.isArray(json.sites) && json.sites.length > 0) {
        memoryCache = json.sites;
        return memoryCache!;
      }
    }
  } catch (err) {
    console.warn('Server fetch sites endpoint failed, trying direct sheet fetch', err);
  }

  // Fallback to direct sheet CSV fetch
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (res.ok) {
      const csvText = await res.text();
      const sites = parseSiteCsv(csvText);
      if (sites.length > 0) {
        memoryCache = sites;
        return memoryCache;
      }
    }
  } catch (err) {
    console.warn('Direct sheet fetch failed', err);
  }

  return getFallbackMasterSites();
}

/**
 * Searches site database by Site ID, Site Name, Subdistrict, Village, or City
 */
export async function searchMasterSites(query: string): Promise<MasterSite[]> {
  if (!query || query.trim().length < 1) return [];

  const sites = await fetchSiteDatabase();
  const q = query.trim().toUpperCase();

  return sites
    .filter(
      (s) =>
        s.siteId.toUpperCase().includes(q) ||
        s.siteName.toUpperCase().includes(q) ||
        (s.subdistrict && s.subdistrict.toUpperCase().includes(q)) ||
        (s.village && s.village.toUpperCase().includes(q)) ||
        (s.city && s.city.toUpperCase().includes(q))
    )
    .slice(0, 15);
}

/**
 * Static fallback dataset for offline mode
 */
function getFallbackMasterSites(): MasterSite[] {
  return [
    {
      siteId: 'BKS010',
      siteName: 'JATIBENING',
      siteOwner: 'MITRATEL',
      city: 'KOTA BEKASI',
      subdistrict: 'PONDOKGEDE',
      village: 'KEL. JATIBENING',
      typeSite: '5.TP Shelter BSC/RNC/Simpul Besar',
      siteClass: 'Gold',
      nop: 'NOP BEKASI',
      lat: -6.263131,
      lng: 106.947019,
    },
    {
      siteId: 'BKS011',
      siteName: 'RUKOANDRE',
      siteOwner: 'MITRATEL',
      city: 'KOTA BEKASI',
      subdistrict: 'JATIASIH',
      village: 'KEL. JATIMEKAR',
      typeSite: '7.TP Shelter Non AC',
      siteClass: 'Silver',
      nop: 'NOP BEKASI',
      lat: -6.289474,
      lng: 106.953996,
    },
    {
      siteId: 'JKT533',
      siteName: 'MSCBUARAN',
      siteOwner: 'TELKOMSEL',
      city: 'JAKARTA TIMUR',
      subdistrict: 'DUREN SAWIT',
      village: 'KEL. DUREN SAWIT',
      typeSite: '1.TELKOMSEL Shelter BSC/RNC/Simpul Besar',
      siteClass: 'Gold',
      nop: 'NOP SOUTHERN JAKARTA',
      lat: -6.218333,
      lng: 106.921667,
    },
  ];
}
