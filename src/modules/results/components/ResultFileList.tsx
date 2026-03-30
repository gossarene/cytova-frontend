import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { FileText, Download, Trash2, Upload, Loader2, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/lib/permissions/Can'
import { P } from '@/lib/permissions/constants'
import { useUploadResultFile, useDeleteResultFile, getFileDownloadUrl } from '../api'
import type { ResultFile, ResultStatus } from '../types'

interface Props {
  resultId: string
  files: ResultFile[]
  status: ResultStatus
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

const MIME_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': FileIcon,
  'image/png': FileIcon,
  'image/tiff': FileIcon,
}

export function ResultFileList({ resultId, files, status }: Props) {
  const uploadMut = useUploadResultFile(resultId)
  const deleteMut = useDeleteResultFile(resultId)
  const [deleteTarget, setDeleteTarget] = useState<ResultFile | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const canModify = status !== 'PUBLISHED'
  const canDelete = status === 'DRAFT'

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Allowed: PDF, JPEG, PNG, TIFF.')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Maximum size: 20 MB.')
      return
    }

    try {
      await uploadMut.mutateAsync(file)
      toast.success(`${file.name} uploaded.`)
    } catch {
      toast.error('Upload failed.')
    }
    e.target.value = '' // Reset input
  }, [uploadMut])

  async function handleDownload(file: ResultFile) {
    setDownloading(file.id)
    try {
      const result = await getFileDownloadUrl(resultId, file.id)
      window.open(result.url, '_blank')
    } catch {
      toast.error('Failed to generate download link.')
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('File removed.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete file.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Attachments ({files.length})
        </CardTitle>
        {canModify && (
          <Can permission={P.FILES_UPLOAD}>
            <label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
                onChange={handleUpload}
                className="hidden"
                disabled={uploadMut.isPending}
              />
              <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-muted transition-colors">
                {uploadMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
              </span>
            </label>
          </Can>
        )}
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No files attached.{canModify && ' Upload PDF or image files.'}
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const Icon = MIME_ICONS[file.mime_type] || FileIcon
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.file_size_kb} KB &middot; {file.mime_type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                    >
                      {downloading === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {canDelete && (
                      <Can permission={P.FILES_UPLOAD}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(file)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete file"
        description={`Remove "${deleteTarget?.original_filename}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </Card>
  )
}
