import { SiteItem, SitePackage, SiteStatus } from '../types/reporting';

/**
 * Helper to check if an item represents Tower Space checklist
 */
export function isTowerItem(site: SiteItem): boolean {
  if (site.packageRole === 'tower') return true;
  return /\btower\b|\bspace\b/i.test(site.text);
}

/**
 * Helper to check if an item represents EAS checklist
 */
export function isEasItem(site: SiteItem): boolean {
  if (site.packageRole === 'eas') return true;
  return /\beas\b|check\s*n\/?a|c[he]{1,2}k\s*eas/i.test(site.text);
}

/**
 * Groups a team's flat site items into unified SitePackages (Site + Tower Space + EAS)
 */
export function groupSitesIntoPackages(sites: SiteItem[]): {
  activePackages: SitePackage[];
  closedPackages: SitePackage[];
  standaloneSites: SiteItem[];
} {
  const packagesMap = new Map<string, Partial<SitePackage>>();
  const unassignedSites: SiteItem[] = [];

  // 1. Group sites that explicitly have a packageId
  sites.forEach((site) => {
    if (site.packageId) {
      if (!packagesMap.has(site.packageId)) {
        packagesMap.set(site.packageId, { packageId: site.packageId });
      }
      const pkg = packagesMap.get(site.packageId)!;

      if (isTowerItem(site)) {
        pkg.towerItem = site;
      } else if (isEasItem(site)) {
        pkg.easItem = site;
      } else {
        pkg.siteItem = site;
      }

      if (site.isClosed) {
        pkg.isClosed = true;
        pkg.closedAt = site.closedAt;
      }
    } else {
      unassignedSites.push(site);
    }
  });

  const packages: SitePackage[] = [];

  // Add all completed explicit packages
  packagesMap.forEach((pkg, pkgId) => {
    if (pkg.siteItem) {
      packages.push({
        packageId: pkgId,
        siteItem: pkg.siteItem,
        towerItem: pkg.towerItem || {
          id: `${pkgId}-tower`,
          packageId: pkgId,
          packageRole: 'tower',
          text: 'Tower space',
          status: pkg.siteItem.status,
          isClosed: pkg.isClosed,
        },
        easItem: pkg.easItem || {
          id: `${pkgId}-eas`,
          packageId: pkgId,
          packageRole: 'eas',
          text: 'EAS',
          status: pkg.siteItem.status,
          isClosed: pkg.isClosed,
        },
        isClosed: !!pkg.isClosed,
        closedAt: pkg.closedAt,
        note: pkg.siteItem.note,
      });
    }
  });

  // 2. Group legacy unassigned items:
  // Identify primary site items (not tower / eas)
  let i = 0;
  while (i < unassignedSites.length) {
    const s0 = unassignedSites[i];
    if (!s0) {
      i++;
      continue;
    }

    // If s0 is an orphaned tower or eas item without a site, skip it
    if (isTowerItem(s0) || isEasItem(s0)) {
      i++;
      continue;
    }

    const s1 = unassignedSites[i + 1];
    const s2 = unassignedSites[i + 2];

    const hasTowerNext = s1 && isTowerItem(s1);
    const hasEasNext = s2 && isEasItem(s2);

    const pkgId = `pkg-auto-${s0.id}`;
    const isClosed = !!(s0.isClosed || (s1?.isClosed && s2?.isClosed));

    const siteItem: SiteItem = {
      ...s0,
      packageId: pkgId,
      packageRole: 'site',
      isClosed,
    };

    const towerItem: SiteItem = hasTowerNext
      ? { ...s1, packageId: pkgId, packageRole: 'tower', isClosed }
      : {
          id: `${pkgId}-tower`,
          packageId: pkgId,
          packageRole: 'tower',
          text: 'Tower space',
          status: s0.status,
          isClosed,
        };

    const easItem: SiteItem = hasEasNext
      ? { ...s2, packageId: pkgId, packageRole: 'eas', isClosed }
      : {
          id: `${pkgId}-eas`,
          packageId: pkgId,
          packageRole: 'eas',
          text: 'EAS',
          status: s0.status,
          isClosed,
        };

    packages.push({
      packageId: pkgId,
      siteItem,
      towerItem,
      easItem,
      isClosed,
      closedAt: s0.closedAt,
      note: s0.note,
    });

    i += hasTowerNext && hasEasNext ? 3 : hasTowerNext ? 2 : 1;
  }

  const activePackages = packages.filter((p) => !p.isClosed);
  const closedPackages = packages.filter((p) => p.isClosed);

  return {
    activePackages,
    closedPackages,
    standaloneSites: [],
  };
}
