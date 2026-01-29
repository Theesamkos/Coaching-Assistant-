import { useEffect, useState } from 'react'
import { FileWithMetadata, FileEntityType } from '../types'
import { fileService } from '../services/fileService'
import FileList from '../components/files/FileList'
import FileViewer from '../components/files/FileViewer'
import FileShareDialog from '../components/files/FileShareDialog'
import FileComments from '../components/files/FileComments'
import Button from '../components/ui/Button'

export default function LibraryPage() {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileWithMetadata | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    try {
      setIsLoading(true)
      // For library, show general and public files
      const all = await fileService.getFilesByEntity('general')
      setFiles(all)
    } catch (err) {
      console.error('Failed to load library files', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    // Basic client-side filter for now
    if (!query) return loadFiles()
    setFiles(files.filter(f => f.fileName.toLowerCase().includes(query.toLowerCase())))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Library</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files"
            className="px-3 py-2 border rounded"
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FileList
            files={files}
            isLoading={isLoading}
            onFileSelect={setSelectedFile}
            showActions={true}
            viewMode={'list'}
          />
        </div>

        <div className="lg:col-span-1">
          {selectedFile ? (
            <div className="space-y-4 sticky top-4">
              <FileViewer
                fileUrl={selectedFile.storageUrl}
                fileName={selectedFile.fileName}
                fileType={selectedFile.fileType}
                description={selectedFile.description}
                uploadedAt={selectedFile.createdAt}
                onClose={() => setSelectedFile(null)}
              />

              <div className="bg-white border p-4 rounded">
                <p className="text-sm text-slate-600">Shared: {selectedFile.shares?.length || 0}</p>
                <div className="mt-3">
                  <Button onClick={() => setShowShareDialog(true)}>Share</Button>
                </div>
              </div>

              {selectedFile.fileType.startsWith('video/') && (
                <FileComments
                  fileId={selectedFile.id}
                  comments={selectedFile.comments || []}
                  onAddComment={async c => {
                    await fileService.addComment(selectedFile.id, c)
                    const updated = await fileService.getFile(selectedFile.id)
                    setSelectedFile(updated)
                    setFiles(files.map(f => (f.id === updated.id ? updated : f)))
                  }}
                  onDeleteComment={async id => {
                    await fileService.deleteComment(id)
                    const updated = await fileService.getFile(selectedFile.id)
                    setSelectedFile(updated)
                    setFiles(files.map(f => (f.id === updated.id ? updated : f)))
                  }}
                  isVideo={true}
                />
              )}

              {showShareDialog && (
                <div className="mt-4">
                  <FileShareDialog
                    fileId={selectedFile.id}
                    existingShares={selectedFile.shares || []}
                    isLoading={false}
                    onShare={async (userId, perm) => {
                      await fileService.shareFile(selectedFile.id, userId, perm as any)
                      const updated = await fileService.getFile(selectedFile.id)
                      setSelectedFile(updated)
                      setFiles(files.map(f => (f.id === updated.id ? updated : f)))
                      setShowShareDialog(false)
                    }}
                    onRevokeShare={async shareId => {
                      await fileService.revokeShare(shareId)
                      const updated = await fileService.getFile(selectedFile.id)
                      setSelectedFile(updated)
                      setFiles(files.map(f => (f.id === updated.id ? updated : f)))
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Select a file to preview</div>
          )}
        </div>
      </div>
    </div>
  )
}
