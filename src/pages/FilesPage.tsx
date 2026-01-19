import { useState, useEffect } from 'react'
import { FileWithMetadata, FileEntityType } from '../types'
import { fileService } from '../services/fileService'
import FileUpload from '../components/files/FileUpload'
import FileList from '../components/files/FileList'
import FileViewer from '../components/files/FileViewer'
import FileShareDialog from '../components/files/FileShareDialog'
import FileComments from '../components/files/FileComments'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'

type ViewMode = 'list' | 'grid'

export default function FilesPage() {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<FileWithMetadata | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterByType, setFilterByType] = useState<FileEntityType | 'all'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [filterByType])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let allFiles: FileWithMetadata[] = []

      if (filterByType === 'all') {
        // Load all files
        const entityTypes: FileEntityType[] = ['drill', 'session', 'player', 'coach', 'general']
        for (const type of entityTypes) {
          const typeFiles = await fileService.getFilesByEntity(type)
          allFiles = [...allFiles, ...typeFiles]
        }
      } else {
        allFiles = await fileService.getFilesByEntity(filterByType)
      }

      setFiles(allFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      console.error('Error loading files:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true)
      setError(null)

      // Upload to storage
      const { url } = await fileService.uploadFile(file, 'general')

      // Create file record
      await fileService.createFile(file, url, {
        entityType: 'general',
        description: `Uploaded ${new Date().toLocaleDateString()}`,
      })

      // Refresh files list
      await loadFiles()
      setShowUploadModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      console.error('Error uploading file:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const fileToDelete = files.find(f => f.id === fileId)
      if (!fileToDelete) return

      // Extract storage path from URL
      const urlParts = fileToDelete.storageUrl.split('/files/')
      const storagePath = urlParts[1] || ''

      await fileService.deleteFile(fileId, storagePath)

      setFiles(files.filter(f => f.id !== fileId))
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
      console.error('Error deleting file:', err)
    }
  }

  const handleAddComment = async (comment: string, timestamp?: number) => {
    if (!selectedFile) return

    try {
      await fileService.addComment(selectedFile.id, comment, timestamp)
      // Refresh the selected file
      const updatedFile = await fileService.getFile(selectedFile.id)
      setSelectedFile(updatedFile)

      // Update in files list
      setFiles(files.map(f => (f.id === updatedFile.id ? updatedFile : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      console.error('Error adding comment:', err)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedFile) return

    try {
      await fileService.deleteComment(commentId)
      // Refresh the selected file
      const updatedFile = await fileService.getFile(selectedFile.id)
      setSelectedFile(updatedFile)

      // Update in files list
      setFiles(files.map(f => (f.id === updatedFile.id ? updatedFile : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
      console.error('Error deleting comment:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Files</h1>
        <Button onClick={() => setShowUploadModal(true)}>+ Upload File</Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <select
            value={filterByType}
            onChange={e => setFilterByType(e.target.value as FileEntityType | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white hover:border-slate-400"
          >
            <option value="all">All Files</option>
            <option value="drill">Drills</option>
            <option value="session">Sessions</option>
            <option value="player">Players</option>
            <option value="coach">Coach</option>
            <option value="general">General</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
            title="List view"
          >
            ☰ List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
            title="Grid view"
          >
            ⊞ Grid
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Files List */}
        <div className="lg:col-span-2">
          <FileList
            files={files}
            isLoading={isLoading}
            onFileSelect={setSelectedFile}
            onDelete={handleDeleteFile}
            onShare={() => {
              setShowShareDialog(true)
            }}
            showActions={true}
            viewMode={viewMode}
            filterByType={filterByType === 'all' ? undefined : filterByType}
          />
        </div>

        {/* Selected File Preview */}
        <div className="lg:col-span-1">
          {selectedFile ? (
            <div className="sticky top-4 space-y-4">
              <FileViewer
                fileUrl={selectedFile.storageUrl}
                fileName={selectedFile.fileName}
                fileType={selectedFile.fileType}
                description={selectedFile.description}
                uploadedAt={selectedFile.createdAt}
                onClose={() => setSelectedFile(null)}
              />

              {/* File Details */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">File Type</p>
                    <p className="text-slate-900 font-medium">{selectedFile.fileType}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Size</p>
                    <p className="text-slate-900 font-medium">
                      {(selectedFile.fileSizeBytes / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="text-slate-900 font-medium">{selectedFile.entityType}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Shared with</p>
                    <p className="text-slate-900 font-medium">
                      {selectedFile.shares?.length || 0} people
                    </p>
                  </div>
                </div>

                {showShareDialog && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <FileShareDialog
                      fileId={selectedFile.id}
                      existingShares={selectedFile.shares || []}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Comments */}
              {selectedFile.fileType.startsWith('video/') && (
                <FileComments
                  fileId={selectedFile.id}
                  comments={selectedFile.comments || []}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  isVideo={true}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Select a file to view details</div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload File</h2>

            <FileUpload
              onFileSelect={handleFileUpload}
              maxSize={50 * 1024 * 1024}
              disabled={isUploading}
            />

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
