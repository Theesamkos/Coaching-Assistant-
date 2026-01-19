import { useState, ReactNode } from 'react'
import Button from '../ui/Button'

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

export default function FileViewer({
  fileUrl,
  fileName,
  fileType,
  description,
  uploadedAt,
  uploadedBy,
  onClose,
  children,
}: FileViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isImage = fileType.startsWith('image/')
  const isVideo = fileType.startsWith('video/')
  const isPdf = fileType === 'application/pdf'

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 truncate">{fileName}</h2>
          {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
          <div className="flex gap-4 mt-2 text-sm text-slate-500">
            {uploadedBy && <span>Uploaded by {uploadedBy}</span>}
            {uploadedAt && <span>{new Date(uploadedAt).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="ml-4 flex gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6v12h12v-4m4-10v12h-4"
                />
              </svg>
            )}
          </button>

          <a
            href={fileUrl}
            download={fileName}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`${isFullscreen ? 'h-screen' : 'max-h-[600px]'} bg-slate-900 flex items-center justify-center overflow-auto`}
      >
        {isImage && (
          <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain" />
        )}

        {isVideo && (
          <video controls className="max-w-full max-h-full" src={fileUrl}>
            Your browser does not support the video tag.
          </video>
        )}

        {isPdf && (
          <iframe src={`${fileUrl}#toolbar=1`} className="w-full h-full" title={fileName} />
        )}

        {!isImage && !isVideo && !isPdf && (
          <div className="text-center py-12 text-slate-400">
            <svg
              className="mx-auto w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-white">Preview not available for this file type</p>
            <p className="text-sm text-slate-400 mt-2">
              <a href={fileUrl} download={fileName} className="text-blue-400 hover:underline">
                Download to view
              </a>
            </p>
          </div>
        )}
      </div>

      {children && (
        <div className={isFullscreen ? 'hidden' : 'border-t border-slate-200 bg-slate-50'}>
          {children}
        </div>
      )}
    </div>
  )
}
