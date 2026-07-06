import type { PresignFileDto, PresignFileResponse, ConfirmFileDto, FileAttachment } from '@godigitify/types';

import { getApiClient } from './client';

export const filesApi = {
  presign: (dto: PresignFileDto) => getApiClient().post<PresignFileResponse>('/files/presign', dto),

  confirm: (dto: ConfirmFileDto) => getApiClient().post<FileAttachment>('/files/confirm', dto),

  getDownloadUrl: (fileId: string) =>
    getApiClient().get<{ url: string; fileName: string }>(`/files/${fileId}/download`),
};
