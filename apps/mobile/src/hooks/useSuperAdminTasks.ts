import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  superAdminTasksService,
  type CreateGovernanceTaskPayload,
} from '../services/superAdminTasks.service';

const QK = {
  overview: ['sa', 'tasks', 'overview'] as const,
  departments: ['sa', 'tasks', 'departments'] as const,
  departmentDetail: (deptId: string) => ['sa', 'tasks', 'departments', deptId] as const,
  escalations: ['sa', 'tasks', 'escalations'] as const,
  governanceGroups: ['sa', 'tasks', 'governance'] as const,
  governanceTask: (id: string) => ['sa', 'tasks', 'governance', id] as const,
  assignableAdmins: ['sa', 'tasks', 'assignable-admins'] as const,
  staffLoad: (staffId: string) => ['sa', 'tasks', 'staff', staffId, 'load'] as const,
  staffTasks: (staffId: string) => ['sa', 'tasks', 'staff', staffId, 'tasks'] as const,
  staffTask: (staffId: string, taskId: string) => ['sa', 'tasks', 'staff', staffId, 'tasks', taskId] as const,
};

export const useOrgTaskOverview = () =>
  useQuery({
    queryKey: QK.overview,
    queryFn: superAdminTasksService.getOrgOverview,
    staleTime: 5 * 60 * 1000,
  });

export const useDepartmentTaskHealth = () =>
  useQuery({
    queryKey: QK.departments,
    queryFn: superAdminTasksService.getDepartmentHealth,
    staleTime: 5 * 60 * 1000,
  });

export const useDepartmentTaskDetail = (deptId: string) =>
  useQuery({
    queryKey: QK.departmentDetail(deptId),
    queryFn: () => superAdminTasksService.getDepartmentDetail(deptId),
    enabled: !!deptId,
    staleTime: 5 * 60 * 1000,
  });

export const useTaskEscalations = () =>
  useQuery({
    queryKey: QK.escalations,
    queryFn: superAdminTasksService.getEscalations,
    staleTime: 2 * 60 * 1000,
  });

export const useGovernanceTaskGroups = () =>
  useQuery({
    queryKey: QK.governanceGroups,
    queryFn: superAdminTasksService.getGovernanceTaskGroups,
    staleTime: 60 * 1000,
  });

export const useGovernanceTask = (id: string) =>
  useQuery({
    queryKey: QK.governanceTask(id),
    queryFn: () => superAdminTasksService.getGovernanceTask(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

export const useAssignableAdmins = () =>
  useQuery({
    queryKey: QK.assignableAdmins,
    queryFn: superAdminTasksService.getAssignableAdmins,
    staleTime: 5 * 60 * 1000,
  });

export const useStaffLoad = (staffId: string) =>
  useQuery({
    queryKey: QK.staffLoad(staffId),
    queryFn: () => superAdminTasksService.getStaffLoad(staffId),
    enabled: !!staffId,
    staleTime: 2 * 60 * 1000,
  });

export const useStaffTasks = (staffId: string) =>
  useQuery({
    queryKey: QK.staffTasks(staffId),
    queryFn: () => superAdminTasksService.getStaffTasks(staffId),
    enabled: !!staffId,
    staleTime: 2 * 60 * 1000,
  });

export const useStaffTask = (staffId: string, taskId: string) =>
  useQuery({
    queryKey: QK.staffTask(staffId, taskId),
    queryFn: () => superAdminTasksService.getStaffTask(staffId, taskId),
    enabled: !!staffId && !!taskId,
    staleTime: 2 * 60 * 1000,
  });

export const useCreateGovernanceTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGovernanceTaskPayload) => superAdminTasksService.createGovernanceTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.governanceGroups });
    },
  });
};
