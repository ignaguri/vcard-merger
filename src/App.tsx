import { Upload } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import type { VCard4 } from 'vcard4-ts';

import ContactPreview from './components/ContactPreview';
import FieldMatcher from './components/FieldMatcher';
import FileUpload from './components/FileUpload';
import type { ParsedFile } from './types';
import { exportCSV, exportVCard, mergeContacts } from './utils/vCardUtils';

type FieldsMapping = Record<keyof VCard4, keyof VCard4>;

function App() {
  const [files, setFiles] = useState<{ name: string; contacts: VCard4[] }[]>(
    [],
  );
  const [mergedContacts, setMergedContacts] = useState<VCard4[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldsMapping>(
    {} as FieldsMapping,
  );
  const [error, setError] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<{
    total: number;
    autoMatched: number;
  } | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(
    new Set(),
  );
  const [showFieldMatcher, setShowFieldMatcher] = useState<boolean>(true);

  const handleFileUpload = useCallback(async (uploadedFiles: ParsedFile[]) => {
    try {
      setFiles(uploadedFiles);
      setMergedContacts([]);
      setMatchStats(null);
      setError(null);
      setSelectedContacts(new Set());
      setShowFieldMatcher(true);
    } catch (err) {
      setError(
        'Error parsing vCard files. Please check the file format and try again.',
      );
      console.error(err);
    }
  }, []);

  const handleMerge = useCallback(() => {
    if (files.length !== 2) return;
    try {
      const merged = mergeContacts(
        files[0].contacts,
        files[1].contacts,
        fieldMappings,
      );
      setMergedContacts(merged);
      setSelectedContacts(new Set(merged.map((_, index) => index)));
      setMatchStats({
        total: merged.length,
        autoMatched:
          merged.length -
          (files[0].contacts.length + files[1].contacts.length - merged.length),
      });
      setError(null);
      setShowFieldMatcher(false);
    } catch (err) {
      setError(
        'Error merging contacts. Please check your field mappings and try again.',
      );
      console.error(err);
    }
  }, [files, fieldMappings]);

  const handleExport = useCallback(
    (format: 'vcard' | 'csv') => {
      try {
        const selectedMergedContacts = mergedContacts.filter((_, index) =>
          selectedContacts.has(index),
        );
        if (format === 'vcard') {
          exportVCard(selectedMergedContacts);
        } else {
          exportCSV(selectedMergedContacts);
        }
        setError(null);
      } catch (err) {
        setError(
          `Error exporting as ${format.toUpperCase()}. Please try again.`,
        );
        console.error(err);
      }
    },
    [mergedContacts, selectedContacts],
  );

  const resetFiles = useCallback(() => {
    setFiles([]);
    setMergedContacts([]);
    setFieldMappings({} as FieldsMapping);
    setMatchStats(null);
    setSelectedContacts(new Set());
    setShowFieldMatcher(true);
  }, []);

  const handleSelectionChange = useCallback(
    (index: number, isSelected: boolean) => {
      setSelectedContacts((prev) => {
        const newSet = new Set(prev);
        if (isSelected) {
          newSet.add(index);
        } else {
          newSet.delete(index);
        }
        return newSet;
      });
    },
    [],
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12 mx-auto">
      <div className="relative py-3 sm:mx-auto w-full px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div>
            <div>
              <h1 className="text-4xl font-semibold text-center mb-8">
                vCard Merger
              </h1>
            </div>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {matchStats && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                <strong className="font-bold">Merge complete: </strong>
                <span className="block sm:inline">
                  {matchStats.autoMatched} contacts automatically matched out of{' '}
                  {matchStats.total} total contacts.
                </span>
              </div>
            )}
            <div className="space-y-8">
              {files.length === 2 ? (
                <button
                  onClick={resetFiles}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Different Files
                </button>
              ) : (
                <FileUpload onFileUpload={handleFileUpload} />
              )}
              {files.length === 2 && showFieldMatcher && (
                <FieldMatcher
                  files={files}
                  onMappingChange={(mappings) =>
                    setFieldMappings(mappings as FieldsMapping)
                  }
                  onMerge={handleMerge}
                />
              )}
              {mergedContacts.length > 0 && (
                <>
                  <ContactPreview
                    contacts={mergedContacts}
                    selectedContacts={selectedContacts}
                    onSelectionChange={handleSelectionChange}
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleExport('vcard')}
                      className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                      Export as vCard
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                      Export as CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
