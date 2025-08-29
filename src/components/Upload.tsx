import React, { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, Users, Download, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UploadResult {
  upload_id: string;
  filename: string;
  total_records: number;
  agents_count: number;
  distribution: Array<{
    agent_id: string;
    agent_name: string;
    count: number;
  }>;
}

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['csv', 'xls', 'xlsx'];

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension || '')) {
      setError('Please select a CSV, XLS, or XLSX file.');
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/distribute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result.data);
      setSuccess(`Successfully uploaded and distributed ${result.data.total_records} records among ${result.data.agents_count} agents.`);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = "FirstName,Phone,Notes\nJohn Doe,1234567890,Sample note\nJane Smith,0987654321,Another sample note";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setError('');
    setSuccess('');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload & Distribute</h1>
        <p className="mt-2 text-gray-600">Upload CSV/Excel files and distribute among agents</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-700">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="text-green-500 hover:text-green-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <FileText className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Need a template?</h3>
            <p className="text-blue-700 mb-4">
              Download our CSV template to ensure your data is in the correct format. 
              Required columns: FirstName, Phone, Notes.
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all btn-hover flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : file 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all btn-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-5 w-5" />
                      <span>Upload & Distribute</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetUpload}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 transition-all"
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse your files
                </p>
              </div>
              <div className="flex justify-center">
                <label htmlFor="file-input" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all cursor-pointer btn-hover">
                  Choose File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-gray-500 max-w-md mx-auto">
                Supported formats: CSV, XLS, XLSX • Maximum file size: 5MB
                <br />
                Required columns: FirstName, Phone, Notes
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Distribution Complete</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{uploadResult.total_records}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{uploadResult.agents_count}</div>
              <div className="text-sm text-gray-600">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(uploadResult.total_records / uploadResult.agents_count)}
              </div>
              <div className="text-sm text-gray-600">Avg. per Agent</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution Details</h3>
            <div className="space-y-3">
              {uploadResult.distribution.map((dist, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dist.agent_name}</p>
                      <p className="text-sm text-gray-500">Agent ID: {dist.agent_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{dist.count}</div>
                    <div className="text-sm text-gray-500">records assigned</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Format Guidelines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">File Format Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Required Columns</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700"><strong>FirstName</strong> - Contact's first name</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700"><strong>Phone</strong> - Contact's phone number</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700"><strong>Notes</strong> - Additional information</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Distribution Logic</h3>
            <div className="space-y-2 text-gray-700">
              <p>• Records are distributed equally among all active agents</p>
              <p>• If total records aren't divisible by agent count, remaining records are distributed sequentially</p>
              <p>• Each agent will receive approximately the same number of records</p>
              <p>• Distribution is saved to the database for tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;