import type { OrganizationConfig, UpdateOrganizationConfigDto } from '@godigitify/types';

import { getApiClient } from './client';

export const organizationApi = {
  getConfig: () => getApiClient().get<OrganizationConfig>('/organization/config'),

  updateConfig: (dto: UpdateOrganizationConfigDto) =>
    getApiClient().patch<OrganizationConfig>('/organization/config', dto),
};
