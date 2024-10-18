import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { VCard4 } from 'vcard4-ts';

import type { ParsedFile } from '../types';

interface FieldMatcherProps {
  files: ParsedFile[];
  onMappingChange: (mappings: Record<string, string>) => void;
  onMerge: () => void;
}

const FieldMatcher: React.FC<FieldMatcherProps> = ({
  files,
  onMappingChange,
  onMerge,
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [fields1, setFields1] = useState<string[]>([]);
  const [fields2, setFields2] = useState<string[]>([]);
  const initialMappingsRef = useRef<Record<string, string>>({});

  const mandatoryFields = ['BEGIN', 'END', 'VERSION'];

  const memoizedOnMappingChange = useCallback(onMappingChange, []);

  useEffect(() => {
    const allFields1 = new Set<string>();
    const allFields2 = new Set<string>();

    files[0].contacts.forEach((contact: VCard4) => {
      Object.keys(contact).forEach((key) => {
        if (!mandatoryFields.includes(key)) {
          allFields1.add(key);
        }
      });
    });

    files[1].contacts.forEach((contact: VCard4) => {
      Object.keys(contact).forEach((key) => {
        if (!mandatoryFields.includes(key)) {
          allFields2.add(key);
        }
      });
    });

    const sortedFields1 = Array.from(allFields1).sort();
    const sortedFields2 = Array.from(allFields2).sort();

    setFields1(sortedFields1);
    setFields2(sortedFields2);

    // Automatic field matching
    const autoMappings: Record<string, string> = {};
    sortedFields1.forEach((field) => {
      if (sortedFields2.includes(field)) {
        autoMappings[field] = field;
      }
    });

    // Add mandatory fields to the mappings
    mandatoryFields.forEach((field) => {
      autoMappings[field] = field;
    });

    initialMappingsRef.current = autoMappings;
    setMappings(autoMappings);
    memoizedOnMappingChange(autoMappings);
  }, [files, memoizedOnMappingChange]);

  const handleMappingChange = (field1: string, field2: string) => {
    const newMappings = { ...mappings, [field1]: field2 };
    setMappings(newMappings);
    memoizedOnMappingChange(newMappings);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-gray-900">Field Matching</h2>
      <p className="text-base text-gray-500">
        Match fields from the first file to fields in the second file. BEGIN,
        END, and VERSION are automatically matched. Fields with the same name
        are preselected.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {files[0].name}
          </h3>
        </div>
        <div className="col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {files[1].name}
          </h3>
        </div>
        {fields1.map((field1) => (
          <div key={field1} className="col-span-2 flex items-center space-x-2">
            <label className="w-1/2 text-sm font-medium text-gray-700">
              {field1}
            </label>
            <select
              className="w-1/2 mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white/80"
              value={mappings[field1] || ''}
              onChange={(e) => handleMappingChange(field1, e.target.value)}
            >
              <option value="">Select a field</option>
              {fields2.map((field2) => (
                <option key={field2} value={field2}>
                  {field2}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        onClick={onMerge}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Merge Contacts
      </button>
    </div>
  );
};

export default FieldMatcher;
