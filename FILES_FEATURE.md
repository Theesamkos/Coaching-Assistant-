# Files Feature - Complete Documentation

## Overview

The Files feature provides a comprehensive file management system for the Coaching Assistant application. It includes:

- **File Upload**: Drag-and-drop and click-to-upload functionality
- **File Management**: View, organize, and delete files
- **File Sharing**: Control access with granular permission levels
- **File Comments**: Add timestamped comments (especially useful for videos)
- **Multiple Views**: List and grid view modes
- **File Filtering**: Filter by entity type (drills, sessions, players, coaches, general)

## Database Schema

### Files Table

Stores metadata about uploaded files:

```sql
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,        -- MIME type
    file_size_bytes INTEGER NOT NULL,
    storage_url TEXT NOT NULL,      -- URL in Supabase Storage
    description TEXT,
    entity_type TEXT,               -- 'drill' | 'session' | 'player' | 'coach' | 'general'
    entity_id UUID,                 -- Reference to the entity
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### File Shares Table

Manages granular access control:

```sql
CREATE TABLE public.file_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id),
    permission_level TEXT NOT NULL  -- 'view' | 'comment' | 'edit' | 'admin'
    shared_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### File Comments Table

Stores comments and annotations on files:

```sql
CREATE TABLE public.file_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    comment TEXT NOT NULL,
    timestamp_position FLOAT,        -- For video files, position in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## TypeScript Types

### FileRecord

Base file data:

```typescript
interface FileRecord {
  id: string
  uploadedBy: string
  fileName: string
  fileType: string // MIME type
  fileSizeBytes: number
  storageUrl: string
  description?: string
  entityType: FileEntityType
  entityId?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}
```

### FileWithMetadata

Enhanced file data with relations:

```typescript
interface FileWithMetadata extends FileRecord {
  uploadedByUser?: Partial<User>
  shares?: FileShare[]
  comments?: FileComment[]
  commentCount: number
}
```

### FileEntityType

```typescript
type FileEntityType = 'drill' | 'session' | 'player' | 'coach' | 'general'
```

### FilePermissionLevel

```typescript
type FilePermissionLevel = 'view' | 'comment' | 'edit' | 'admin'
```

## Components

### FileUpload

Drag-and-drop file upload component with validation.

**Props:**

```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string // MIME types to accept
  maxSize?: number // Max file size in bytes
  disabled?: boolean
  multiple?: boolean
}
```

**Usage:**

```tsx
<FileUpload onFileSelect={handleFileSelect} accept="image/*" maxSize={50 * 1024 * 1024} />
```

### FileList

Display files in list or grid view with actions.

**Props:**

```typescript
interface FileListProps {
  files: FileWithMetadata[]
  isLoading?: boolean
  onFileSelect?: (file: FileWithMetadata) => void
  onDelete?: (fileId: string) => void
  onShare?: (fileId: string) => void
  showActions?: boolean
  viewMode?: 'list' | 'grid'
  filterByType?: FileEntityType
}
```

**Usage:**

```tsx
<FileList files={files} onFileSelect={setSelectedFile} onDelete={handleDelete} viewMode="grid" />
```

### FileViewer

Preview files with support for images, videos, and PDFs.

**Props:**

```typescript
interface FileViewerProps {
  fileUrl: string
  fileName: string
  fileType: string
  description?: string
  uploadedAt?: Date
  uploadedBy?: string
  onClose?: () => void
  children?: ReactNode
}
```

**Features:**

- Image preview
- Video player with controls
- PDF viewer (embedded)
- Download button
- Fullscreen mode
- Responsive design

### FileComments

Add and view comments on files with video timestamp support.

**Props:**

```typescript
interface FileCommentsProps {
  fileId: string
  comments: FileComment[]
  onAddComment?: (comment: string, timestampPosition?: number) => void
  onDeleteComment?: (commentId: string) => void
  isLoading?: boolean
  isVideo?: boolean
  currentTime?: number
}
```

**Features:**

- Timestamped comments for video files
- Real-time comment addition
- Delete own comments
- Formatted timestamps

### FileShareDialog

Manage file sharing with granular permissions.

**Props:**

```typescript
interface FileShareDialogProps {
  fileId: string
  existingShares: FileShare[]
  onShare?: (userId: string, permissionLevel: FilePermissionLevel) => void
  onRevokeShare?: (shareId: string) => void
  isLoading?: boolean
  availableUsers?: Array<{ id: string; displayName: string; email: string }>
}
```

**Permission Levels:**

- **View**: Read-only access
- **Comment**: View and add comments
- **Edit**: Modify file details and metadata
- **Admin**: Full control including sharing

## Service: fileService

Comprehensive API for file operations.

### Methods

#### uploadFile

```typescript
await fileService.uploadFile(
  file: File,
  entityType: FileEntityType,
  options?: Partial<FileUploadOptions>
): Promise<{ path: string; url: string }>
```

#### createFile

```typescript
await fileService.createFile(
  file: File,
  uploadUrl: string,
  options: FileUploadOptions
): Promise<FileRecord>
```

#### getFilesByEntity

```typescript
await fileService.getFilesByEntity(
  entityType: FileEntityType,
  entityId?: string
): Promise<FileWithMetadata[]>
```

#### getFile

```typescript
await fileService.getFile(fileId: string): Promise<FileWithMetadata>
```

#### deleteFile

```typescript
await fileService.deleteFile(
  fileId: string,
  storagePath: string
): Promise<void>
```

#### shareFile

```typescript
await fileService.shareFile(
  fileId: string,
  userId: string,
  permissionLevel?: FilePermissionLevel
): Promise<FileShare>
```

#### revokeShare

```typescript
await fileService.revokeShare(shareId: string): Promise<void>
```

#### addComment

```typescript
await fileService.addComment(
  fileId: string,
  comment: string,
  timestampPosition?: number
): Promise<FileComment>
```

#### deleteComment

```typescript
await fileService.deleteComment(commentId: string): Promise<void>
```

#### getFileComments

```typescript
await fileService.getFileComments(fileId: string): Promise<FileComment[]>
```

## Utilities: fileUtils

Helper functions for file operations.

### formatFileSize(bytes: number): string

```typescript
formatFileSize(1024 * 1024) // "1 MB"
```

### getFileCategory(mimeType: string)

Returns: `'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'`

### getFileIcon(mimeType: string): string

Returns appropriate emoji icon for file type.

### isPreviewable(mimeType: string): boolean

Check if file type can be previewed.

### validateFileSize(file: File, maxSizeBytes?: number)

Validate file size with detailed error messages.

### validateFileType(file: File, allowedTypes: string[])

Validate file MIME type against allowed list.

## Pages

### FilesPage (/pages/FilesPage.tsx)

Complete example implementation showing all features:

- File upload with modal
- List and grid view switching
- Entity type filtering
- File preview with viewer
- Comment management
- Share dialog
- Delete functionality

## Row-Level Security (RLS)

All file tables have RLS policies:

**Files Table:**

- Users can view their own files
- Users can view files shared with them
- Users can view public files
- Users can upload, update, and delete their own files

**File Shares Table:**

- File owner can manage shares
- Shared users can view their shares

**File Comments Table:**

- Users can only comment on accessible files
- Users can only delete their own comments

## Supabase Storage Configuration

Files are stored in Supabase Storage bucket: `files`

**Bucket structure:**

```
files/
├── drill/
├── session/
├── player/
├── coach/
└── general/
```

Each file is organized by entity type and timestamp.

## Integration Example

```tsx
import { useEffect, useState } from 'react'
import { FileUpload, FileList, FileViewer } from '@/components/files'
import { fileService } from '@/services/fileService'

export default function MyFilesFeature() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    // Load files for a specific entity
    fileService.getFilesByEntity('drill', drillId).then(setFiles)
  }, [])

  const handleUpload = async (file: File) => {
    const { url } = await fileService.uploadFile(file, 'drill')
    await fileService.createFile(file, url, {
      entityType: 'drill',
      entityId: drillId,
    })
    // Reload files...
  }

  return (
    <div>
      <FileUpload onFileSelect={handleUpload} />
      <FileList files={files} onFileSelect={setSelectedFile} />
      {selectedFile && (
        <FileViewer
          fileUrl={selectedFile.storageUrl}
          fileName={selectedFile.fileName}
          fileType={selectedFile.fileType}
        />
      )}
    </div>
  )
}
```

## Migration

Run the migration to set up database tables:

```bash
node run-migration.cjs
```

Or manually run [04_files_feature.sql](../migrations/04_files_feature.sql)

## Next Steps

1. **Configure Storage**: Set up Supabase Storage bucket policies
2. **Add to Routes**: Integrate FilesPage into application routes
3. **Entity Integration**: Attach files to drills, sessions, etc.
4. **Notifications**: Add email notifications for shared files
5. **Analytics**: Track file usage and sharing patterns
