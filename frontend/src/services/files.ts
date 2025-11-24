import api from './api'
import type { FileItem } from '@/types'

export const fileService = {
  async upload(file: File): Promise<FileItem> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<FileItem>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async list(): Promise<FileItem[]> {
    const response = await api.get<FileItem[]>('/files')
    return response.data
  },

  async getDownloadUrl(id: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/files/${id}/download`)
    return response.data.url
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/files/${id}`)
  },
}