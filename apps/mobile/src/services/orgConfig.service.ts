/**
 * Organization Configuration Service — Super Admin org-wide settings.
 *
 * Mock implementation — replace method bodies with a real API call
 * (PATCH /organization/config) when the backend is ready. Signature is
 * stable: UI never imports MOCK_ORG_CONFIG directly.
 */

import { MOCK_ORG_CONFIG, type OrgConfig } from '../data/orgConfig.mock';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let _orgConfig: OrgConfig = {
  ...MOCK_ORG_CONFIG,
  defaultTaskCategories: [...MOCK_ORG_CONFIG.defaultTaskCategories],
};

export const orgConfigService = {
  async getOrgConfig(): Promise<OrgConfig> {
    await delay(300);
    return _orgConfig;
  },

  async updateOrgConfig(patch: Partial<OrgConfig>): Promise<OrgConfig> {
    await delay(300);
    _orgConfig = { ..._orgConfig, ...patch };
    return _orgConfig;
  },
};
