import { api } from '@/lib/api';
import type { GenerateReportDto } from '@godigitify/types';

export const reportsService = {
  /** POST the config, receive the file, and trigger a browser download. */
  async generate(dto: GenerateReportDto): Promise<void> {
    const res = await api.post('/reports/generate', dto, { responseType: 'blob' });
    const cd = (res.headers['content-disposition'] as string | undefined) ?? '';
    const filename = /filename="?([^"]+)"?/.exec(cd)?.[1] ?? `report.${dto.format}`;

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
