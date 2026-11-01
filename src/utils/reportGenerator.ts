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
  lines.push('*Daily Reporting. DEPOTEL*');
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

    // Sort closed packages chronologically by closed timestamp
    const sortedClosedPackages = [...closedPackages].sort((a, b) => {
      const timeA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const timeB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return timeA - timeB;
    });

    // Display ALL site packages added to this team (both active and closed) so Preview shows all sites for each team
    const packagesToDisplay = [...activePackages, ...sortedClosedPackages];

    if (packagesToDisplay.length === 0) {
      lines.push('- Tidak ada site -');
    } else {
      let itemNumber = 1;
      packagesToDisplay.forEach((pkg) => {
        // 1. Site item line
        const siteText = pkg.siteItem?.text || pkg.siteItem?.siteName || 'Site';
        const siteStatus = pkg.siteItem?.status || (pkg.isClosed ? 'DONE' : 'PROGRESS');
        lines.push(`${itemNumber++}. ${formatSiteLine(siteText, siteStatus)}`);

        // 2. SPACE TOWER item line
        const towerText = pkg.towerItem?.text || 'Tower space';
        const towerStatus = pkg.towerItem?.status || (pkg.isClosed ? 'DONE' : 'UNCHECKED');
        lines.push(`${itemNumber++}. ${formatSiteLine(towerText, towerStatus)}`);

        // 3. CEK EAS item line
        const easText = pkg.easItem?.text || 'EAS';
        const easStatus = pkg.easItem?.status || (pkg.isClosed ? 'DONE' : 'UNCHECKED');
        lines.push(`${itemNumber++}. ${formatSiteLine(easText, easStatus)}`);

        // Note under item 3. CEK EAS
        const pkgNote = pkg.siteItem?.note?.trim() || pkg.note?.trim() || '-';
        lines.push(`*NOTE :* ${pkgNote}`);
      });
    }

    lines.push('');
  });

  // PM Genset Fix Section
  lines.push('*D. PM Genset Fix*');
  lines.push('');
  lines.push('List Site:');

  if (data.gensetFixSites.length === 0) {
    lines.push('');
  } else {
    data.gensetFixSites.forEach((gSite, idx) => {
      const formattedLine = formatSiteLine(gSite.siteName, gSite.status);
      lines.push(`${idx + 1}. ${formattedLine}`);
    });
    lines.push('');
  }

  lines.push('*NOTE*');
  if (data.note && data.note.trim().length > 0) {
    lines.push(data.note.trim());
  }
  lines.push('');
  lines.push('*Terimakasih*');

  return lines.join('\n');
}
