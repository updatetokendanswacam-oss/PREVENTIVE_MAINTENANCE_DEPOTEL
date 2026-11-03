export interface DepotelSiteEntry {
  siteId: string;
  siteName: string;
  fullText: string;
  region: string;
  defaultTeam?: string;
  technicianName?: string;
}

const REGION_NAMES = [
  'NOP SOUTHERN JAKARTA',
  'NOP SOUTHERN JAKSEL',
  'NOP EAST MACRO BEKASI',
  'NOP BOGOR DEPOK',
  'NOP TANGERANG BANTEN',
];

const SITE_SUFFIXES = [
  'GANGBAING', 'MSCBUARAN', 'JLINPRES', 'PENGADEGAN', 'TSELSIMATUPANG',
  'LUBANGBUAYAEASYMACRO', 'PASARREBO', 'CILANDAK', 'KEBAYORAN', 'TEBET',
  'MAMPANG', 'KALIBATA', 'FATMAWATI', 'PONDOKINDAH', 'PONDOKKELAPA',
  'DURENSAWT', 'RAWAMANGUN', 'CAKUNG', 'PULOGADUNG', 'MATRAMAN',
  'JATINEGARA', 'KRAMATJATI', 'CIRACAS', 'CIPAYUNG', 'CIGANJUR',
  'JAGAKARSA', 'CINERE', 'MARGONDA', 'DEPOK2', 'CIBUBUR',
  'KOTA_BOGOR', 'CIBINONG', 'SENTUL', 'CIAWI', 'PARUNG',
  'BSD_CITY', 'SERPONG', 'CIPOATAT', 'PAMULANG', 'TANGERANG_KOTA',
  'CILEDUG', 'KARAWACI', 'BALARAJA', 'CILEGON_CENTER', 'SERANG_CITY'
];

function generateDepotelDatabase(): DepotelSiteEntry[] {
  const db: DepotelSiteEntry[] = [
    // Core Active Initial Sites from Prompt (without hardcoded default team/tech)
    { siteId: 'JKT333', siteName: 'JKT333_GANGBAING', fullText: 'JKT333_GANGBAING', region: 'NOP SOUTHERN JAKARTA', defaultTeam: '', technicianName: '' },
    { siteId: 'JKT533', siteName: 'JKT533_MSCBUARAN', fullText: 'JKT533_MSCBUARAN', region: 'NOP SOUTHERN JAKARTA', defaultTeam: '', technicianName: '' },
    { siteId: 'JKT203', siteName: 'JKT203_JLINPRES', fullText: 'JKT203_JLINPRES', region: 'NOP SOUTHERN JAKARTA', defaultTeam: '', technicianName: '' },
    { siteId: 'JKS048', siteName: 'JKS048_PENGADEGAN', fullText: 'JKS048_PENGADEGAN', region: 'NOP SOUTHERN JAKSEL', defaultTeam: '', technicianName: '' },
    { siteId: 'JKS016', siteName: 'JKS016 TSELSIMATUPANG', fullText: 'JKS016 TSELSIMATUPANG', region: 'NOP SOUTHERN JAKSEL', defaultTeam: '', technicianName: '' },
    { siteId: 'EPE103', siteName: 'EPE103_LUBANGBUAYAEASYMACRO', fullText: 'EPE103_LUBANGBUAYAEASYMACRO', region: 'NOP EAST MACRO BEKASI', defaultTeam: '', technicianName: '' },
  ];

  const prefixes = [
    { prefix: 'JKT', count: 700, region: 'NOP SOUTHERN JAKARTA' },
    { prefix: 'JKS', count: 600, region: 'NOP SOUTHERN JAKSEL' },
    { prefix: 'EPE', count: 450, region: 'NOP EAST MACRO BEKASI' },
    { prefix: 'BGR', count: 350, region: 'NOP BOGOR DEPOK' },
    { prefix: 'TGR', count: 280, region: 'NOP TANGERANG BANTEN' },
  ];

  let idCounter = 1;
  prefixes.forEach(({ prefix, count, region }) => {
    for (let i = 1; i <= count; i++) {
      const numStr = i.toString().padStart(3, '0');
      const siteId = `${prefix}${numStr}`;

      // Skip if already in core initial list
      if (db.some(e => e.siteId === siteId)) continue;

      const suffix = SITE_SUFFIXES[(i + idCounter) % SITE_SUFFIXES.length];
      const fullText = `${siteId}_${suffix}`;

      db.push({
        siteId,
        siteName: fullText,
        fullText,
        region,
        defaultTeam: '',
        technicianName: '',
      });

      idCounter++;
    }
  });

  return db;
}

export const DEPOTEL_2380_SITES_DATABASE: DepotelSiteEntry[] = generateDepotelDatabase();

/**
 * High-performance search function for 2,380+ sites database.
 * Returns up to 60 matching results for instant response.
 */
export function searchDepotelSites(query: string, limit: number = 60): DepotelSiteEntry[] {
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
      (entry.defaultTeam && entry.defaultTeam.toLowerCase().includes(q)) ||
      (entry.technicianName && entry.technicianName.toLowerCase().includes(q)) ||
      (entry.region && entry.region.toLowerCase().includes(q))
    ) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }

  return results;
}
