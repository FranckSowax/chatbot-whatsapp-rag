'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import useSWR, { mutate } from 'swr'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Trash2, RefreshCw, AlertCircle } from 'lucide-react'

type Document = {
  id: number
  filename: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  created_at: string
}

export default function DocumentsPage() {
  const { data: documents, error, isLoading } = useSWR<Document[]>('documents', () => api.documents.list())
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadError('')

    try {
      for (const file of acceptedFiles) {
        await api.documents.upload(file)
      }
      mutate('documents')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await api.documents.delete(id)
      mutate('documents')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      processing: 'bg-yellow-100 text-yellow-700',
      processed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">
          Upload PDF documents to build your chatbot&apos;s knowledge base
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {uploadError}
            </div>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-gray-400" />
              )}
              <div>
                <p className="text-gray-700 font-medium">
                  {isDragActive
                    ? 'Drop the files here...'
                    : uploading
                    ? 'Uploading...'
                    : 'Drag & drop PDF files here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum file size: 20MB, up to 200 pages
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Documents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => mutate('documents')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load documents
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first PDF to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
