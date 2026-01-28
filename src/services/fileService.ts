/**
 * File service for interacting with the files API
 */

import { supabase } from '../config/supabase'
import {
  FileRecord,
  FileWithMetadata,
  FileShare,
  FileComment,
  FileEntityType,
  FileUploadOptions,
  FilePermissionLevel,
} from '../types'

export const fileService = {
  async _authHeaders(): Promise<Record<string, string>> {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (token) return { Authorization: `Bearer ${token}` }
    } catch (err) {
      // ignore
    }
    return {}
  },

  async uploadFile(
    file: File,
    entityType: FileEntityType,
    options: Partial<FileUploadOptions> = {}
  ): Promise<{ path: string; url: string }> {
    const params = new URLSearchParams({ entityType })
    const resp = await fetch(`/api/files/presigned?${params.toString()}`, {
      headers: await this._authHeaders(),
    })

    const presigned = await resp.json()
    if (!presigned || !presigned.path) throw new Error('Failed to get upload path')

    const filePath = presigned.path
    const { error } = await supabase.storage.from('files').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) throw new Error(`File upload failed: ${error.message}`)

    const { data: publicData } = supabase.storage.from('files').getPublicUrl(filePath)
    return { path: filePath, url: publicData.publicUrl }
  },

  async createFile(file: File, uploadUrl: string, options: FileUploadOptions): Promise<FileRecord> {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('files')
      .insert([
        {
          uploaded_by: userId,
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          storage_url: uploadUrl,
          description: options.description,
          entity_type: options.entityType,
          entity_id: options.entityId,
          is_public: options.isPublic || false,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to create file record: ${error.message}`)
    return this._mapFileRecord(data)
  },

  async getFilesByEntity(
    entityType: FileEntityType,
    entityId?: string
  ): Promise<FileWithMetadata[]> {
    const params = new URLSearchParams({ entityType })
    if (entityId) params.set('entityId', entityId)

    const resp = await fetch(`/api/files/list?${params.toString()}`, {
      headers: await this._authHeaders(),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error)

    return (body.data || []).map((file: any) => this._mapFileWithMetadata(file))
  },

  async getFile(fileId: string): Promise<FileWithMetadata> {
    const resp = await fetch(`/api/files/get?id=${encodeURIComponent(fileId)}`, {
      headers: await this._authHeaders(),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error)
    return this._mapFileWithMetadata(body.data)
  },

  async deleteFile(fileId: string, storagePath: string): Promise<void> {
    const resp = await fetch(`/api/files/delete?id=${encodeURIComponent(fileId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this._authHeaders()),
      },
      body: JSON.stringify({ storagePath }),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error || 'Failed to delete file')
  },

  async shareFile(
    fileId: string,
    userId: string,
    permissionLevel: FilePermissionLevel = 'view'
  ): Promise<FileShare> {
    const resp = await fetch(`/api/files/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this._authHeaders()),
      },
      body: JSON.stringify({ fileId, sharedWithUserId: userId, permissionLevel }),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error || 'Failed to share file')
    return body.data
  },

  async revokeShare(shareId: string): Promise<void> {
    const { error } = await supabase.from('file_shares').delete().eq('id', shareId)
    if (error) throw new Error(`Failed to revoke share: ${error.message}`)
  },

  async addComment(
    fileId: string,
    comment: string,
    timestampPosition?: number
  ): Promise<FileComment> {
    const resp = await fetch(`/api/files/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this._authHeaders()),
      },
      body: JSON.stringify({ fileId, comment, timestampPosition }),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error || 'Failed to add comment')
    return body.data
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('file_comments').delete().eq('id', commentId)
    if (error) throw new Error(`Failed to delete comment: ${error.message}`)
  },

  async getFileComments(fileId: string): Promise<FileComment[]> {
    const { data, error } = await supabase
      .from('file_comments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch comments: ${error.message}`)
    return data || []
  },

  _mapFileRecord(data: any): FileRecord {
    return {
      id: data.id,
      uploadedBy: data.uploaded_by,
      fileName: data.file_name,
      fileType: data.file_type,
      fileSizeBytes: data.file_size_bytes,
      storageUrl: data.storage_url,
      description: data.description,
      entityType: data.entity_type,
      entityId: data.entity_id,
      isPublic: data.is_public,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  },

  _mapFileWithMetadata(data: any): FileWithMetadata {
    const fileRecord = this._mapFileRecord(data)
    return {
      ...fileRecord,
      commentCount: (data.file_comments || []).length,
      comments: (data.file_comments || []).map((c: any) => ({
        id: c.id,
        fileId: c.file_id,
        userId: c.user_id,
        comment: c.comment,
        timestampPosition: c.timestamp_position,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })),
      shares: (data.file_shares || []).map((s: any) => ({
        id: s.id,
        fileId: s.file_id,
        sharedWithUserId: s.shared_with_user_id,
        permissionLevel: s.permission_level,
        sharedByUserId: s.shared_by_user_id,
        createdAt: new Date(s.created_at),
      })),
    }
  },
}
