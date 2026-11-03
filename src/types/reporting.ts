export type SiteStatus = 'DONE' | 'NOK' | 'PROGRESS' | 'NA' | 'UNCHECKED';

export type LiveConnectionStatus = 'LIVE' | 'CONNECTING' | 'OFFLINE' | 'SYNCING';

export interface SiteItem {
  id: string;
  packageId?: string;
  packageRole?: 'site' | 'tower' | 'eas';
  siteId?: string;
  siteName?: string;
  text: string;
  status: SiteStatus;
  lat?: number;
  lng?: number;
  note?: string;
  photoUrl?: string; // Technician documentation photo
  isClosed?: boolean;
  closedAt?: string;
  closedCategoryTitle?: string;
  lastUpdatedBy?: string;
}

export interface SitePackage {
  packageId: string;
  siteItem: SiteItem;
  towerItem: SiteItem;
  easItem: SiteItem;
  isClosed: boolean;
  closedAt?: string;
  note?: string;
}

export interface TeamData {
  id: string;
  teamNumber: number;
  name: string;
  phone: string;
  sites: SiteItem[];
}

export interface JobCategory {
  id: string;
  title: string;
  target: number;
  achievement: number;
  remaining: number;
  percentage: number;
  isManualOverride?: boolean;
}

export interface GensetFixSite {
  id: string;
  siteId?: string;
  siteName: string;
  status: SiteStatus;
  lat?: number;
  lng?: number;
  note?: string;
  photoUrl?: string; // Photo documentation
  technicianName?: string;
}

export interface ReportDateInfo {
  isoDate: string; // YYYY-MM-DD
  dayName: string; // SAT, SUN, MON, etc.
  displayDate: string; // DD/MM/YYYY
  formatted: string; // e.g. "SAT, 31/10/2026"
}

export interface DailyReportData {
  id: string;
  dateInfo: ReportDateInfo;
  categories: JobCategory[];
  teams: TeamData[];
  gensetFixSites: GensetFixSite[];
  note: string;
  customWhatsAppReport?: string;
  isCustomWhatsAppEdited?: boolean;
  updatedAt: string;
  lastUpdatedBy?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type UserRole = 'ROLE_ADMIN' | 'ROLE_USER';
export type AccountStatus = 'AKTIF' | 'NONAKTIF';

export interface AppAccount {
  id: string;
  uid?: string; // Firebase Auth UID
  name: string; // NAMA USER / NAMA ADMIN
  email: string; // GMAIL / GOOGLE
  role: UserRole; // ROLE ADMIN / ROLE USER
  status: AccountStatus; // AKTIF / NONAKTIF
  approved?: boolean; // Admin approval flag
  assignedTeamId?: string; // e.g. "team-1", "team-2", "ALL"
  isGoogleConnected: boolean;
  avatarUrl?: string;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}
