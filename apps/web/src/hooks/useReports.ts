'use client';

import { useMutation } from '@tanstack/react-query';
import type { GenerateReportDto } from '@godigitify/types';
import { reportsService } from '@/services/reports.service';

/** Generate a report and download it. Synchronous — no queue/polling. */
export const useGenerateReport = () =>
  useMutation({ mutationFn: (dto: GenerateReportDto) => reportsService.generate(dto) });
