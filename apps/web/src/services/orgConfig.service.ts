import { api } from '@/lib/api';
import type { OrganizationConfig, UpdateOrganizationConfigDto } from '@godigitify/types';

type Envelope<T> = { data: T };

export const orgConfigService = {
  async get(): Promise<OrganizationConfig> {
    const res = await api.get<Envelope<OrganizationConfig>>('/organization/config');
    return res.data.data;
  },
  async update(dto: UpdateOrganizationConfigDto): Promise<OrganizationConfig> {
    const res = await api.patch<Envelope<OrganizationConfig>>('/organization/config', dto);
    return res.data.data;
  },
};
