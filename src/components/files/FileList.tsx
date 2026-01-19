import { useEffect, useState } from 'react'
import { FileWithMetadata, FileEntityType } from '../../types'
import { formatFileSize, getFileIcon, getFileCategory } from '../../lib/fileUtils'
import LoadingSpinner from '../ui/LoadingSpinner'

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

export default function FileList({
  files,
  isLoading = false,
  onFileSelect,
  onDelete,
  onShare,
  showActions = true,
  viewMode = 'list',
  filterByType,
}: FileListProps) {
  const [filteredFiles, setFilteredFiles] = useState<FileWithMetadata[]>(files)

  useEffect(() => {
    let result = files

    if (filterByType) {
      result = result.filter(f => f.entityType === filterByType)
    }

    setFilteredFiles(result)
  }, [files, filterByType])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-4 text-slate-600">No files found</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => (
          <FileGridCard
            key={file.id}
            file={file}
            onSelect={onFileSelect}
            onDelete={onDelete}
            onShare={onShare}
            showActions={showActions}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredFiles.map(file => (
        <FileListItem
          key={file.id}
          file={file}
          onSelect={onFileSelect}
          onDelete={onDelete}
          onShare={onShare}
          showActions={showActions}
        />
      ))}
    </div>
  )
}

interface FileListItemProps {
  file: FileWithMetadata
  onSelect?: (file: FileWithMetadata) => void
  onDelete?: (fileId: string) => void
  onShare?: (fileId: string) => void
  showActions?: boolean
}

function FileListItem({
  file,
  onSelect,
  onDelete,
  onShare,
  showActions = true,
}: FileListItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      onClick={() => onSelect?.(file)}
    >
      <div className="flex items-center flex-1 min-w-0 cursor-pointer">
        <div className="flex-shrink-0">{getFileIcon(file.fileType)}</div>
        <div className="ml-4 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{file.fileName}</p>
          <p className="text-sm text-slate-500">
            {formatFileSize(file.fileSizeBytes)} • {new Date(file.createdAt).toLocaleDateString()}
          </p>
          {file.description && (
            <p className="text-sm text-slate-600 truncate mt-1">{file.description}</p>
          )}
        </div>
      </div>

      {showActions && (
        <div className="ml-4 flex-shrink-0 flex gap-2">
          {onShare && (
            <button
              onClick={e => {
                e.stopPropagation()
                onShare(file.id)
              }}
              className="text-slate-600 hover:text-blue-600 text-sm font-medium"
              title="Share file"
            >
              Share
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => {
                e.stopPropagation()
                onDelete(file.id)
              }}
              className="text-slate-600 hover:text-red-600 text-sm font-medium"
              title="Delete file"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FileGridCard({
  file,
  onSelect,
  onDelete,
  onShare,
  showActions = true,
}: FileListItemProps) {
  const category = getFileCategory(file.fileType)

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect?.(file)}
    >
      <div className="aspect-square bg-slate-100 flex items-center justify-center">
        <div className="text-4xl">{getFileIcon(file.fileType)}</div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-slate-900 truncate">{file.fileName}</h3>
        <p className="text-sm text-slate-500 mt-1">{formatFileSize(file.fileSizeBytes)}</p>
        <p className="text-xs text-slate-400 mt-2">
          {new Date(file.createdAt).toLocaleDateString()}
        </p>

        {showActions && (
          <div className="mt-4 flex gap-2">
            {onShare && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onShare(file.id)
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
              >
                Share
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDelete(file.id)
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
