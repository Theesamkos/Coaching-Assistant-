/**
 * File service for interacting with the files API
 */

import { supabase } from '../config/supabase'
import { FileRecord, FileWithMetadata, FileShare, FileComment, FileEntityType, FileUploadOptions, FilePermissionLevel } from '../types'

export const fileService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    entityType: FileEntityType,
    options: Partial<FileUploadOptions> = {}
  ): Promise<{ path: string; url: string }> {
    const fileName = file.name
    const filePath = `${entityType}/${Date.now()}-${fileName}`

    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`File upload failed: ${error.message}`)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('files').getPublicUrl(filePath)

    return { path: filePath, url: publicUrl }
  },

  /**
   * Create a file record in the database
   */
  async createFile(
    file: File,
    uploadUrl: string,
    options: FileUploadOptions
  ): Promise<FileRecord> {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

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

    if (error) {
      throw new Error(`Failed to create file record: ${error.message}`)
    }

    return this._mapFileRecord(data)
  },

  /**
   * Get files for a specific entity
   */
  async getFilesByEntity(
    entityType: FileEntityType,
    entityId?: string
  ): Promise<FileWithMetadata[]> {
    let query = supabase
      .from('files')
      .select(
        `
        *,
        file_comments(id),
        file_shares(*)
      `
      )
      .eq('entity_type', entityType)

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`)
    }

    return (data || []).map((file) => this._mapFileWithMetadata(file))
  },

  /**
   * Get a single file with all metadata
   */
  async getFile(fileId: string): Promise<FileWithMetadata> {
    const { data, error } = await supabase
      .from('files')
      .select(
        `
        *,
        file_comments(*),
        file_shares(*)
      `
      )
      .eq('id', fileId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch file: ${error.message}`)
    }

    return this._mapFileWithMetadata(data)
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, storagePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([storagePath])

    if (storageError) {
      console.warn(`Failed to delete file from storage: ${storageError.message}`)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      throw new Error(`Failed to delete file: ${dbError.message}`)
    }
  },

  /**
   * Share a file with a user
   */
  async shareFile(
    fileId: string,
    userId: string,
    permissionLevel: FilePermissionLevel = 'view'
  ): Promise<FileShare> {
    const currentUser = (await supabase.auth.getUser()).data.user?.id
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('file_shares')
      .insert([
        {
          file_id: fileId,
          shared_with_user_id: userId,
          shared_by_user_id: currentUser,
          permission_level: permissionLevel,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to share file: ${error.message}`)
    }

    return data
  },

  /**
   * Revoke file access
   */
  async revokeShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId)

    if (error) {
      throw new Error(`Failed to revoke share: ${error.message}`)
    }
  },

  /**
   * Add a comment to a file
   */
  async addComment(
    fileId: string,
    comment: string,
    timestampPosition?: number
  ): Promise<FileComment> {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('file_comments')
      .insert([
        {
          file_id: fileId,
          user_id: userId,
          comment,
          timestamp_position: timestampPosition,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`)
    }

    return data
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('file_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`)
    }
  },

  /**
   * Get all comments for a file
   */
  async getFileComments(fileId: string): Promise<FileComment[]> {
    const { data, error } = await supabase
      .from('file_comments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return data || []
  },

  // Helper methods
  private _mapFileRecord(data: any): FileRecord {
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

  private _mapFileWithMetadata(data: any): FileWithMetadata {
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
