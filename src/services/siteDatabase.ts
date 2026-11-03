import { DEPOTEL_2380_SITES_DATABASE } from '../data/depotelDatabase';

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

function getBuiltInMasterSites(): MasterSite[] {
  return DEPOTEL_2380_SITES_DATABASE.map((d) => {
    let cleanName = d.siteName;
    if (cleanName.startsWith(d.siteId + '_')) {
      cleanName = cleanName.slice(d.siteId.length + 1);
    }
    return {
      siteId: d.siteId,
      siteName: cleanName || d.siteName,
      nop: d.region,
      city: d.region,
      cluster: 'DEPOTEL',
    };
  });
}

/**
 * Searches site database by Site ID, Site Name, NOP, or Cluster.
 * Searches across all 2,380+ sites from Google Sheet 1KFQ8WY4NNFAnPuzMYwKnJW9GyvmuPYFfLyk2u8If5AU
 */
export async function searchMasterSites(query: string, limit: number = 60): Promise<MasterSite[]> {
  return searchMasterSitesSync(query, limit);
}

/**
 * Synchronous version for instant input response
 */
export function searchMasterSitesSync(query: string, limit: number = 60): MasterSite[] {
  if (!query || query.trim().length < 1) return [];

  const q = query.trim().toUpperCase();
  const builtIn = getBuiltInMasterSites();

  return builtIn
    .filter(
      (s) =>
        s.siteId.toUpperCase().includes(q) ||
        s.siteName.toUpperCase().includes(q) ||
        (s.nop && s.nop.toUpperCase().includes(q))
    )
    .slice(0, limit);
}

export async function fetchSiteDatabase(): Promise<MasterSite[]> {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }
  memoryCache = getBuiltInMasterSites();
  return memoryCache;
}
