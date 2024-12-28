import React from 'react';
import { Upload } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';

export const FileUpload: React.FC = () => {
  const { handleFileChange, isDragging, dragProps } = useFileUpload();

  return (
    <div className="relative">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls,.tsv"
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        {...dragProps}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
          ${isDragging 
            ? 'bg-blue-600/20 border-2 border-blue-500 border-dashed' 
            : 'bg-gray-700 hover:bg-gray-600'
          }
          transition-colors
        `}
      >
        <Upload size={18} className="text-blue-400" />
        <span className="text-sm">Upload Data</span>
      </label>
    </div>
  );
};