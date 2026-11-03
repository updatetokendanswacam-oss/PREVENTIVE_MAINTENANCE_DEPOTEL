import { DailyReportData, SiteStatus } from '../types/reporting';
import { groupSitesIntoPackages } from './packageUtils';

export function formatSiteLine(text: string, status: SiteStatus): string {
  let cleanText = text.trim();
  // Strip trailing emojis if present to avoid duplicates
  cleanText = cleanText.replace(/[\s✅❌⏳]+$/, '').trim();

  switch (status) {
    case 'DONE':
      return `${cleanText} ✅`;
    case 'NOK':
      return `${cleanText} ❌`;
    case 'PROGRESS':
      return `${cleanText} ⏳`;
    case 'NA':
      return `${cleanText}`;
    case 'UNCHECKED':
    default:
      return cleanText;
  }
}

export function generateWhatsAppReport(data: DailyReportData): string {
  const lines: string[] = [];

  // Header
  lines.push('*Daily Reporting DEPOTEL*');
  lines.push('');
  lines.push(`*Day/Date : ${data.dateInfo.formatted}*`);
  lines.push('');

  // Categories
  const nop = data.categories.find((c) => c.id === 'nop_southern') || {
    title: 'PM SITE NOP SOUTHERN',
    target: 118,
    achievement: 118,
    remaining: 0,
    percentage: 100,
  };

  lines.push('*A. PM SITE NOP SOUTHERN*');
  lines.push('Target/Achievement/Remaining/%');
  lines.push(`*${nop.target}/${nop.achievement}/${nop.remaining}/${nop.percentage}%*`);
  lines.push('');

  const genset = data.categories.find((c) => c.id === 'pm_genset') || {
    title: 'PM GENSET',
    target: 0,
    achievement: 0,
    remaining: 0,
    percentage: 100,
  };

  lines.push('*B. PM GENSET*');
  lines.push('Target/Achievement/Remaining/%');
  lines.push(`*${genset.target}/${genset.achievement}/${genset.remaining}/${genset.percentage}%*`);
  lines.push('');

  const tower = data.categories.find((c) => c.id === 'space_tower') || {
    title: 'SPACE TOWER',
    target: 116,
    achievement: 67,
    remaining: 49,
    percentage: 57,
  };

  lines.push('*C. SPACE TOWER*');
  lines.push(`${tower.target}/${tower.achievement}/${tower.remaining}/${tower.percentage}%`);
  lines.push('');

  // Teams Section
  lines.push('*D. PM Site*');
  lines.push('');

  data.teams.forEach((team, index) => {
    const teamNum = team.teamNumber || index + 1;
    lines.push(`*Team ${teamNum}*`);
    lines.push(`1. ${team.name.toUpperCase()} (${team.phone})`);
    lines.push('');
    lines.push('Site List:');

    const { activePackages, closedPackages } = groupSitesIntoPackages(team.sites);

    // All packages (both active AND closed sites) must appear in Preview Laporan WhatsApp!
    const packagesToDisplay = [...activePackages, ...closedPackages];

    if (packagesToDisplay.length === 0) {
      lines.push('');
    } else {
      let packageIndex = 1;
      packagesToDisplay.forEach((pkg) => {
        // 1. Primary Site item line
        const siteText = pkg.siteItem?.text || pkg.siteItem?.siteName || 'Site';
        const siteStatus = pkg.siteItem?.status || (pkg.isClosed ? 'DONE' : 'PROGRESS');
        lines.push(`${packageIndex++}. ${formatSiteLine(siteText, siteStatus)}`);

        // 2. SPACE TOWER item line
        const towerText = pkg.towerItem?.text || 'Tower Space';
        const towerStatus = pkg.towerItem?.status || (pkg.isClosed ? 'DONE' : 'UNCHECKED');
        lines.push(` • ${formatSiteLine(towerText, towerStatus)}`);

        // 3. EAS item line
        const easText = pkg.easItem?.text || 'EAS';
        const easStatus = pkg.easItem?.status || (pkg.isClosed ? 'DONE' : 'UNCHECKED');
        lines.push(` • ${formatSiteLine(easText, easStatus)}`);

        // Optional Note under item if present
        const pkgNote = pkg.siteItem?.note?.trim() || pkg.note?.trim();
        if (pkgNote) {
          lines.push(` *NOTE :* ${pkgNote}`);
        }
      });
    }

    lines.push('');
  });

  // PM Genset Fix Section
  lines.push('*D. PM Genset Fix*');
  lines.push('');

  const KNOWN_TECH_PHONES: Record<string, string> = {
    'SAMIN': '082374227775',
    'MUHAMAD JUNAEDI': '08119234976',
    'RANDI AFDIANSYAH': '08131423533',
    'KOSASIH': '08119234974',
    'ROMI HENDRA GUNAWAN': '081319012052',
    'ROY ISHARRYANTO': '081286241842',
    'DODI': '081283606526',
  };

  if (!data.gensetFixSites || data.gensetFixSites.length === 0) {
    lines.push('List Site:');
    lines.push('');
  } else {
    // Group Genset Fix sites by technician
    const techMap = new Map<string, { techName: string; phone: string; sites: typeof data.gensetFixSites }>();

    data.gensetFixSites.forEach((gSite) => {
      const rawTech = (gSite.technicianName || 'TEKNISI').trim();
      const upperTech = rawTech.toUpperCase();
      let phone = (gSite.technicianPhone || '').trim();
      if (!phone && KNOWN_TECH_PHONES[upperTech]) {
        phone = KNOWN_TECH_PHONES[upperTech];
      }

      const groupKey = `${upperTech}_${phone}`;
      if (!techMap.has(groupKey)) {
        techMap.set(groupKey, { techName: upperTech, phone, sites: [] });
      }
      techMap.get(groupKey)!.sites.push(gSite);
    });

    let techIdx = 1;
    techMap.forEach(({ techName, phone, sites }) => {
      const phoneStr = phone ? ` (${phone})` : '';
      lines.push(`${techIdx++}. ${techName}${phoneStr}`);

      sites.forEach((site) => {
        const siteLine = formatSiteLine(site.siteName, site.status);
        lines.push(` • ${siteLine}`);
        const noteText = site.note?.trim() || '';
        lines.push(`Keterangan : ${noteText}`);
      });
      lines.push('');
    });
  }

  lines.push('*NOTE*');
  if (data.note && data.note.trim().length > 0) {
    lines.push(data.note.trim());
  }
  lines.push('');
  lines.push('*Terimakasih*');

  return lines.join('\n');
}
