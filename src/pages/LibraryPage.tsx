import { useEffect, useMemo, useState } from 'react'
import { FileWithMetadata, FileEntityType } from '../types'
import { fileService } from '../services/fileService'
import FileList from '../components/files/FileList'
import FileViewer from '../components/files/FileViewer'
import FileShareDialog from '../components/files/FileShareDialog'
import FileComments from '../components/files/FileComments'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const PAGE_SIZE = 12

export default function LibraryPage() {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileWithMetadata | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [query, setQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<FileEntityType | 'all'>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)

  // debounce timer id
  const [debounceId, setDebounceId] = useState<number | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles(pageOverride?: number) {
    try {
      setIsLoading(true)
      // Use server-side search with current filters
      const entity = entityFilter === 'all' ? undefined : entityFilter
      const pageToFetch = pageOverride ?? page
      const resp = await fileService.searchFiles({
        q: query || undefined,
        entityType: entity as any,
        sort,
        page: pageToFetch,
        pageSize,
      })
      setFiles(resp.data)
      setTotalCount(resp.count)
      setPage(pageToFetch)
    } catch (err) {
      console.error('Failed to load library files', err)
    } finally {
      setIsLoading(false)
    }
  }

  // When page changes, fetch that page
  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Debounce search/filter/sort changes and reset page
  useEffect(() => {
    if (debounceId) window.clearTimeout(debounceId)
    const id = window.setTimeout(() => {
      if (page !== 1) {
        setPage(1)
      } else {
        loadFiles()
      }
    }, 300)
    setDebounceId(id)
    return () => {
      window.clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, entityFilter, sort, pageSize])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paged = files

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Library</h1>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-2 items-center">
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value as FileEntityType | 'all')}
              className="px-3 py-2 border rounded bg-white text-sm"
            >
              <option value="all">All</option>
              <option value="drill">Drills</option>
              <option value="session">Sessions</option>
              <option value="player">Players</option>
              <option value="coach">Coach</option>
              <option value="general">General</option>
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="px-3 py-2 border rounded bg-white text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  loadFiles(1)
                }
              }}
              placeholder="Search files or descriptions"
              className="px-3 py-2 border rounded text-sm"
            />
            <Button
              onClick={() => {
                loadFiles(1)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">{totalCount} results</div>
        <div className="flex items-center gap-2">
          <button
            title="List view"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded border ${viewMode === 'list' ? 'bg-blue-50 border-blue-300' : 'border-slate-200'}`}
          >
            List
          </button>
          <button
            title="Grid view"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded border ${viewMode === 'grid' ? 'bg-blue-50 border-blue-300' : 'border-slate-200'}`}
          >
            Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : paged.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No files found.</div>
          ) : (
            <FileList
              files={paged}
              isLoading={isLoading}
              onFileSelect={setSelectedFile}
              showActions={true}
              viewMode={viewMode}
            />
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
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
                <div className="mt-3 flex gap-2">
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
