import { MOCK_REPORTS, REPORT_TYPES, type ReportRecord } from '@/data/reports.mock';

const DELAY_MS = 400;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export const reportsService = {
  async list(): Promise<ReportRecord[]> {
    await delay();
    return [...MOCK_REPORTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async request(type: string, dateRange?: { from: string; to: string }): Promise<ReportRecord> {
    await delay();
    const typeInfo = REPORT_TYPES.find((r) => r.type === type);
    const id = `report_${Date.now()}`;
    const now = new Date().toISOString();
    const newReport: ReportRecord = {
      id,
      type,
      label: typeInfo?.label ?? type,
      status: 'PROCESSING',
      requestedBy: 'user_sa',
      requesterName: 'Dr. Ramesh Iyer',
      dateRange: dateRange ?? {
        from: new Date(Date.now() - 30 * 86400000).toISOString(),
        to: now,
      },
      createdAt: now,
    };
    MOCK_REPORTS.unshift(newReport);

    // Simulate async completion after 3 seconds
    setTimeout(() => {
      newReport.status = 'COMPLETED';
      newReport.downloadUrl = '#';
      newReport.fileSizeKb = Math.floor(Math.random() * 400 + 100);
      newReport.completedAt = new Date().toISOString();
    }, 3000);

    return newReport;
  },

  getTypes() {
    return REPORT_TYPES;
  },
};

export type { ReportRecord };
