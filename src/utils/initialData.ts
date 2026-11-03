import { DailyReportData } from '../types/reporting';
import { createReportDateInfo } from './dateUtils';

export function getInitialReportData(): DailyReportData {
  const dateInfo = createReportDateInfo();

  return {
    id: `report-${dateInfo.isoDate}`,
    dateInfo,
    categories: [
      {
        id: 'nop_southern',
        title: 'PM SITE NOP SOUTHERN',
        target: 118,
        achievement: 118,
        remaining: 0,
        percentage: 100,
      },
      {
        id: 'pm_genset',
        title: 'PM GENSET',
        target: 0,
        achievement: 0,
        remaining: 0,
        percentage: 100,
      },
      {
        id: 'space_tower',
        title: 'SPACE TOWER',
        target: 116,
        achievement: 67,
        remaining: 49,
        percentage: 57,
      },
    ],
    teams: [
      {
        id: 'team-1',
        teamNumber: 1,
        name: 'SAMIN',
        phone: '082374227775',
        sites: [
          { id: 's1-1', text: 'JKT333_GANGBAING', status: 'DONE' },
          { id: 's1-2', text: 'Tower Space', status: 'DONE' },
          { id: 's1-3', text: 'EAS', status: 'NOK' },
        ],
      },
      {
        id: 'team-2',
        teamNumber: 2,
        name: 'MUHAMAD JUNAEDI',
        phone: '08119234976',
        sites: [
          { id: 's2-1', text: 'JKT533_MSCBUARAN', status: 'DONE' },
          { id: 's2-2', text: 'Tower Space', status: 'DONE' },
          { id: 's2-3', text: 'EAS', status: 'DONE' },
        ],
      },
      {
        id: 'team-3',
        teamNumber: 3,
        name: 'RANDI AFDIANSYAH',
        phone: '08131423533',
        sites: [
          { id: 's3-1', text: 'JKT203_JLINPRES', status: 'DONE' },
          { id: 's3-2', text: 'Tower Space', status: 'DONE' },
          { id: 's3-3', text: 'EAS', status: 'DONE' },
        ],
      },
      {
        id: 'team-4',
        teamNumber: 4,
        name: 'KOSASIH',
        phone: '08119234974',
        sites: [
          { id: 's4-1', text: 'JKS048_PENGADEGAN', status: 'DONE' },
          { id: 's4-2', text: 'Tower Space', status: 'NOK' },
          { id: 's4-3', text: 'EAS', status: 'NOK' },
        ],
      },
      {
        id: 'team-5',
        teamNumber: 5,
        name: 'ROMI HENDRA GUNAWAN',
        phone: '081319012052',
        sites: [
          { id: 's5-1', text: 'JKS016 TSELSIMATUPANG', status: 'DONE' },
          { id: 's5-2', text: 'Tower Space', status: 'NOK' },
          { id: 's5-3', text: 'EAS', status: 'DONE' },
        ],
      },
      {
        id: 'team-6',
        teamNumber: 6,
        name: 'ROY ISHARRYANTO',
        phone: '081286241842',
        sites: [
          { id: 's6-1', text: 'EPE103_LUBANGBUAYAEASYMACRO', status: 'DONE' },
          { id: 's6-2', text: 'Tower Space', status: 'DONE' },
          { id: 's6-3', text: 'EAS', status: 'DONE' },
        ],
      },
    ],
    gensetFixSites: [],
    note: 'Terimakasih.',
    updatedAt: new Date().toISOString(),
  };
}
