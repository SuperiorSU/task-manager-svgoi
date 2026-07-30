import type { PresignFileDto, PresignFileResponse, ConfirmFileDto, FileAttachment, User } from '@godigitify/types';

import { getApiClient } from './client';

export const filesApi = {
  presign: (dto: PresignFileDto) => getApiClient().post<PresignFileResponse>('/files/presign', dto),

  confirm: (dto: ConfirmFileDto) => getApiClient().post<FileAttachment>('/files/confirm', dto),

  getDownloadUrl: (fileId: string) =>
    getApiClient().get<{ url: string; fileName: string }>(`/files/${fileId}/download`),

  // Avatar upload (user-scoped, images only). `confirm` returns the caller's
  // updated profile with a freshly signed avatarUrl.
  avatarPresign: (dto: { fileName: string; mimeType: string }) =>
    getApiClient().post<{ uploadUrl: string; storageKey: string }>('/files/avatar/presign', dto),

  avatarConfirm: (dto: { storageKey: string }) =>
    getApiClient().post<User>('/files/avatar/confirm', dto),
};
