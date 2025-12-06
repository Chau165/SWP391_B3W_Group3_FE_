// src/pages/ImageUploadTest.tsx - Temporary testing component
import { useState } from 'react'
import { uploadEventBanner, validateImageFile, deleteEventBanner } from '../utils/imageUpload'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

export default function ImageUploadTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadedUrl, setUploadedUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      validateImageFile(file, 5) // Validate file
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
      setSuccess('')
    } catch (err: any) {
      setError(err.message)
      setSelectedFile(null)
      setPreviewUrl('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const url = await uploadEventBanner(selectedFile)
      setUploadedUrl(url)
      setSuccess(`Upload successful! URL: ${url}`)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!uploadedUrl) return

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      await deleteEventBanner(uploadedUrl)
      setSuccess('Image deleted successfully!')
      setUploadedUrl('')
      setSelectedFile(null)
      setPreviewUrl('')
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setUploadedUrl('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <p className="text-sm text-yellow-700">
              <strong>Testing Page</strong> - This is a temporary page for testing Supabase image uploads.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Image Upload Test
      </h1>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Image</h2>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image (Max 5MB, JPG/PNG/GIF/WebP)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-md w-full h-auto rounded-lg border-2 border-gray-200"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !selectedFile || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload to Supabase'}
            </button>

            {selectedFile && !uploading && (
              <button
                onClick={handleClear}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success!</p>
              <p className="text-sm text-green-700 mt-1 break-all">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <X className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Image */}
      {uploadedUrl && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Uploaded Image</h2>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {uploading ? 'Deleting...' : 'Delete from Supabase'}
            </button>
          </div>

          <div className="mb-4">
            <img
              src={uploadedUrl}
              alt="Uploaded"
              className="max-w-md w-full h-auto rounded-lg border-2 border-gray-200"
            />
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600 font-mono break-all">
              {uploadedUrl}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
          <li>Create a storage bucket named "event-banners" and set it to public</li>
          <li>Copy your project URL and anon key</li>
          <li>Create a <code className="bg-blue-100 px-1 rounded">.env</code> file with:
            <div className="bg-blue-100 rounded p-2 mt-1 font-mono text-xs">
              VITE_SUPABASE_URL=your_url<br/>
              VITE_SUPABASE_ANON_KEY=your_key
            </div>
          </li>
          <li>Restart the dev server</li>
        </ol>
      </div>
    </div>
  )
}
