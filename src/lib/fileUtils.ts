/**
 * File utilities for handling file operations
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'

  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }

  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
    return 'archive'
  }

  return 'other'
}

export function getFileIcon(mimeType: string): string {
  const category = getFileCategory(mimeType)

  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    archive: '📦',
    other: '📎',
  }

  return icons[category]
}

export function isPreviewable(mimeType: string): boolean {
  const previewableMimes = [
    'image/',
    'video/',
    'application/pdf',
    'text/plain',
    'text/html',
    'application/json',
  ]

  return previewableMimes.some(mime => mimeType.startsWith(mime))
}

export function validateFileSize(
  file: File,
  maxSizeBytes: number = 50 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  return { valid: true }
}

export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (allowedTypes.length === 0) {
    return { valid: true }
  }

  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -2))
    }
    return file.type === type
  })

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

export function generatePresignedUrl(
  fileName: string,
  fileType: string,
  expiresIn: number = 3600
): string {
  // This would typically be done on the server
  // For now, return a placeholder that would be replaced with actual implementation
  return `/api/files/presigned?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}&expiresIn=${expiresIn}`
}
