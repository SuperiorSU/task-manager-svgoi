import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import type { GenerateReportDto, ReportType } from '@godigitify/types';

import { prisma } from '../../config/database.js';

type Viewer = { id: string; role: string; departmentId?: string | undefined };

// Intermediate, format-agnostic representation. Each report type produces this;
// the CSV/XLSX/PDF renderers consume it — so data logic and file format stay
// decoupled.
type ReportData = {
  title: string;
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date;
  createdAt: Date;
  completedAt: Date | null;
  assignee: { id: string; name: string; employeeId: string | null } | null;
  creator: { id: string; name: string; department: { name: string } | null } | null;
  department: { name: string; code: string } | null;
};

const REPORT_LABELS: Record<ReportType, string> = {
  TASK_SUMMARY: 'Task Summary',
  USER_PERFORMANCE: 'User Performance',
  DEPARTMENT_COMPARISON: 'Department Comparison',
  OVERDUE_ANALYSIS: 'Overdue Analysis',
  CROSS_DEPT_ASSIGNMENT: 'Cross-Department Assignments',
};

const isOverdue = (t: TaskRow): boolean =>
  !['COMPLETED', 'CANCELLED'].includes(t.status) && t.dueDate < new Date();

const scopeLabel = (dto: GenerateReportDto, deptName?: string, personName?: string): string => {
  switch (dto.scope) {
    case 'department': return `Department: ${deptName ?? '—'}`;
    case 'admin': return `Assigned by: ${personName ?? '—'}`;
    case 'employee': return `Employee: ${personName ?? '—'}`;
    default: return 'Organisation-wide';
  }
};

// ─── Data ─────────────────────────────────────────────────────────────────────

async function buildReportData(dto: GenerateReportDto, viewer: Viewer): Promise<ReportData> {
  const from = new Date(dto.dateRange.from);
  const to = new Date(dto.dateRange.to);

  const where: Record<string, unknown> = { isDeleted: false, createdAt: { gte: from, lte: to } };

  // RBAC: an ADMIN can only ever report on their own department, whatever scope
  // they asked for. SUPER_ADMIN may target any department/person.
  if (viewer.role === 'ADMIN') {
    where['departmentId'] = viewer.departmentId ?? '__none__';
  } else if (dto.scope === 'department' && dto.targetId) {
    where['departmentId'] = dto.targetId;
  }
  if (dto.scope === 'employee' && dto.targetId) where['assigneeId'] = dto.targetId;
  if (dto.scope === 'admin' && dto.targetId) where['creatorId'] = dto.targetId;
  if (dto.filters?.status) where['status'] = dto.filters.status;
  if (dto.filters?.priority) where['priority'] = dto.filters.priority;

  const tasks = (await prisma.task.findMany({
    where: where as never,
    take: 5000,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true, completedAt: true,
      assignee: { select: { id: true, name: true, employeeId: true } },
      creator: { select: { id: true, name: true, department: { select: { name: true } } } },
      department: { select: { name: true, code: true } },
    },
  })) as unknown as TaskRow[];

  // Resolve a friendly scope target name for the subtitle.
  let targetName: string | undefined;
  if (dto.targetId) {
    if (dto.scope === 'department') {
      targetName = (await prisma.department.findUnique({ where: { id: dto.targetId }, select: { name: true } }))?.name;
    } else {
      targetName = (await prisma.user.findUnique({ where: { id: dto.targetId }, select: { name: true } }))?.name;
    }
  }
  const range = `${dayjs(from).format('DD MMM YYYY')} – ${dayjs(to).format('DD MMM YYYY')}`;
  const subtitle = `${scopeLabel(dto, targetName, targetName)}  ·  ${range}`;
  const title = REPORT_LABELS[dto.type];

  switch (dto.type) {
    case 'OVERDUE_ANALYSIS': {
      const rows = tasks
        .filter(isOverdue)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .map((t) => [
          t.title, t.assignee?.name ?? '—', t.department?.name ?? '—',
          dayjs(t.dueDate).format('DD MMM YYYY'), Math.max(0, dayjs().diff(dayjs(t.dueDate), 'day')), t.status,
        ]);
      return { title, subtitle, columns: ['Task', 'Assignee', 'Department', 'Due', 'Days Overdue', 'Status'], rows };
    }
    case 'CROSS_DEPT_ASSIGNMENT': {
      const rows = tasks
        .filter((t) => t.creator?.department?.name && t.department?.name && t.creator.department.name !== t.department.name)
        .map((t) => [
          t.title, t.creator?.name ?? '—', t.creator?.department?.name ?? '—',
          t.department?.name ?? '—', t.assignee?.name ?? '—', t.status,
        ]);
      return { title, subtitle, columns: ['Task', 'Assigned By', 'From Dept', 'To Dept', 'Assignee', 'Status'], rows };
    }
    case 'USER_PERFORMANCE': {
      const byUser = new Map<string, { name: string; empId: string | null; assigned: number; completed: number; overdue: number; onTime: number }>();
      for (const t of tasks) {
        if (!t.assignee) continue;
        const u = byUser.get(t.assignee.id) ?? { name: t.assignee.name, empId: t.assignee.employeeId, assigned: 0, completed: 0, overdue: 0, onTime: 0 };
        u.assigned++;
        if (t.status === 'COMPLETED') { u.completed++; if (t.completedAt && t.completedAt <= t.dueDate) u.onTime++; }
        if (isOverdue(t)) u.overdue++;
        byUser.set(t.assignee.id, u);
      }
      const rows = [...byUser.values()]
        .sort((a, b) => b.assigned - a.assigned)
        .map((u) => [u.name, u.empId ?? '—', u.assigned, u.completed, u.overdue, u.completed > 0 ? `${Math.round((u.onTime / u.completed) * 100)}%` : '—']);
      return { title, subtitle, columns: ['Employee', 'ID', 'Assigned', 'Completed', 'Overdue', 'On-time %'], rows };
    }
    case 'DEPARTMENT_COMPARISON': {
      const byDept = new Map<string, { name: string; code: string; total: number; completed: number; overdue: number }>();
      for (const t of tasks) {
        const key = t.department?.name ?? 'Unassigned';
        const d = byDept.get(key) ?? { name: key, code: t.department?.code ?? '—', total: 0, completed: 0, overdue: 0 };
        d.total++;
        if (t.status === 'COMPLETED') d.completed++;
        if (isOverdue(t)) d.overdue++;
        byDept.set(key, d);
      }
      const rows = [...byDept.values()]
        .sort((a, b) => b.total - a.total)
        .map((d) => [d.name, d.code, d.total, d.completed, d.overdue, d.total > 0 ? `${Math.round((d.completed / d.total) * 100)}%` : '—']);
      return { title, subtitle, columns: ['Department', 'Code', 'Total', 'Completed', 'Overdue', 'Completion %'], rows };
    }
    case 'TASK_SUMMARY':
    default: {
      const rows = tasks.map((t) => [
        t.title, t.status, t.priority, t.department?.name ?? '—', t.assignee?.name ?? '—',
        dayjs(t.dueDate).format('DD MMM YYYY'), t.completedAt ? dayjs(t.completedAt).format('DD MMM YYYY') : '—', isOverdue(t) ? 'Yes' : 'No',
      ]);
      return { title, subtitle, columns: ['Task', 'Status', 'Priority', 'Department', 'Assignee', 'Due', 'Completed', 'Overdue'], rows };
    }
  }
}

// ─── Renderers ────────────────────────────────────────────────────────────────

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function renderCsv(data: ReportData): Buffer {
  const lines = [data.columns.map(csvCell).join(','), ...data.rows.map((r) => r.map(csvCell).join(','))];
  return Buffer.from('﻿' + lines.join('\r\n'), 'utf8'); // BOM for Excel-friendly UTF-8
}

async function renderXlsx(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(data.title.slice(0, 31));
  ws.addRow([data.title]);
  ws.addRow([data.subtitle]);
  ws.addRow([]);
  const header = ws.addRow(data.columns);
  header.font = { bold: true };
  header.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; });
  for (const r of data.rows) ws.addRow(r);
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => { max = Math.max(max, String(cell.value ?? '').length + 2); });
    col.width = Math.min(48, max);
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function renderPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width - 72; // minus margins
    const colW = pageW / data.columns.length;

    doc.fillColor('#1A5CF8').fontSize(16).font('Helvetica-Bold').text(data.title);
    doc.moveDown(0.2);
    doc.fillColor('#64748B').fontSize(9).font('Helvetica').text(data.subtitle);
    doc.moveDown(0.6);

    const drawRow = (cells: (string | number)[], bold: boolean) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(bold ? '#0F172A' : '#334155');
      cells.forEach((cell, i) => {
        doc.text(String(cell), 36 + i * colW, y, { width: colW - 6, height: 12, ellipsis: true, lineBreak: false });
      });
      doc.y = y + 16;
      doc.moveTo(36, doc.y - 4).lineTo(36 + pageW, doc.y - 4).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    };

    drawRow(data.columns, true);
    if (data.rows.length === 0) {
      doc.moveDown(0.5).fillColor('#94A3B8').fontSize(9).text('No records match this report.');
    }
    for (const row of data.rows) {
      if (doc.y > doc.page.height - 40) { doc.addPage(); }
      drawRow(row, false);
    }
    doc.end();
  });
}

// ─── Public ───────────────────────────────────────────────────────────────────

const CONTENT_TYPE: Record<GenerateReportDto['format'], string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export const reportsService = {
  async generate(dto: GenerateReportDto, viewer: Viewer): Promise<{ filename: string; contentType: string; buffer: Buffer }> {
    const data = await buildReportData(dto, viewer);
    const stamp = dayjs().format('YYYYMMDD-HHmm');
    const base = `${dto.type.toLowerCase()}-${stamp}`;
    const buffer =
      dto.format === 'xlsx' ? await renderXlsx(data) :
      dto.format === 'pdf' ? await renderPdf(data) :
      renderCsv(data);
    return { filename: `${base}.${dto.format}`, contentType: CONTENT_TYPE[dto.format], buffer };
  },
};
