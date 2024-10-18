import { Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import React from 'react';
import { parseVCards } from 'vcard4-ts';

import type { ParsedFile } from '../types';

interface FileUploadProps {
  onFileUpload: (files: ParsedFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const parsedFiles = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          const contacts = parseVCards(text).vCards || [];
          return { name: file.name, contacts };
        }),
      );
      onFileUpload(parsedFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="file-upload"
          className="block text-lg font-medium text-gray-700"
        >
          Upload vCard Files
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span className="text-base">Upload two files</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".vcf,.vcard"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">vCard files only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
