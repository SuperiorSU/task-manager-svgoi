import { getApiClient } from './client';

export const filesApi = {
  getDownloadUrl: (fileId: string) =>
    getApiClient().get<{ url: string; fileName: string }>(`/files/${fileId}/download`),
};
