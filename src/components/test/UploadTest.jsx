import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const UploadTest = () => {
  const { uploading, progress, uploadSingle, uploadMultiple, getImageUrl } = useFileUpload();
  const { isAuthenticated } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleUploadSingle = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const result = await uploadSingle(selectedFiles[0]);
      setUploadedFiles(prev => [...prev, result.file]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleUploadMultiple = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const result = await uploadMultiple(selectedFiles);
      setUploadedFiles(prev => [...prev, ...result.files]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-16 pb-16 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
            <CardDescription>
              Please log in to test file uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              File uploads require authentication. Please visit{' '}
              <a href="/auth-test" className="text-blue-600 hover:underline">
                /auth-test
              </a>{' '}
              to log in first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-16 pb-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* API Indicator Banner */}
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
            <p className="font-bold">Testing File Upload API</p>
            <p className="text-sm">Upload endpoint: http://localhost:3003/api/upload</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload Test
                </CardTitle>
                <CardDescription>
                  Test the new file upload system with image processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Drop images here</p>
                  <p className="text-sm text-gray-600 mb-4">
                    or click to select files
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-input" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                {selectedFiles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUploadSingle}
                      disabled={uploading || selectedFiles.length === 0}
                      className="flex-1"
                    >
                      {uploading ? 'Uploading...' : 'Upload Single'}
                    </Button>
                    <Button
                      onClick={handleUploadMultiple}
                      disabled={uploading || selectedFiles.length === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      {uploading ? 'Uploading...' : 'Upload All'}
                    </Button>
                  </div>
                )}

                {/* Progress Bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file(s) uploaded successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={clearUploadedFiles}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Clear All
                    </Button>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              <img
                                src={getImageUrl(file.id, 'thumbnail')}
                                alt={file.originalName}
                                className="w-16 h-16 object-cover rounded"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE4IDMwTDI0IDI0TDQwIDQwIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                                }}
                              />
                            </div>
                            
                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {file.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                              </p>
                              
                              {/* Image URLs */}
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium text-gray-700">Available sizes:</p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(file.processedImages).map(([size, info]) => (
                                    <a
                                      key={size}
                                      href={info.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                                    >
                                      {size}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadTest;
