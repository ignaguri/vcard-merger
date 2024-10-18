import React, { useState } from 'react';
import type { VCard4 } from 'vcard4-ts';

interface ContactPreviewProps {
  contacts: VCard4[];
  selectedContacts: Set<number>;
  onSelectionChange: (index: number, isSelected: boolean) => void;
}

const valueToString = (value: any): string => {
  if (Array.isArray(value)) {
    return value.map((v) => valueToString(v)).join(', ');
  } else if (typeof value === 'object' && value !== null) {
    if ('value' in value) {
      if (Array.isArray(value.value)) {
        return value.value.map((v) => valueToString(v)).join(', ');
      } else if (typeof value.value === 'object' && value.value !== null) {
        return valueToString(value.value);
      } else {
        return String(value.value);
      }
    } else {
      return JSON.stringify(value);
    }
  } else {
    return String(value);
  }
};

const mandatoryFields: (keyof VCard4)[] = ['BEGIN', 'END', 'VERSION'];
const hiddenFields: (keyof VCard4)[] = ['nags', 'hasErrors', 'CATEGORIES'];

const fieldTypes: Partial<Record<keyof VCard4, string>> = {
  FN: 'text',
  N: 'text',
  ADR: 'text',
  TEL: 'tel',
  EMAIL: 'email',
  URL: 'url',
  BDAY: 'date',
  NOTE: 'textarea',
};

const ContactPreview: React.FC<ContactPreviewProps> = ({
  contacts,
  selectedContacts,
  onSelectionChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editableContacts, setEditableContacts] = useState<VCard4[]>(contacts);

  const contactsPerPage = 15;
  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = editableContacts.slice(
    indexOfFirstContact,
    indexOfLastContact,
  );

  const totalPages = Math.ceil(editableContacts.length / contactsPerPage);

  if (editableContacts.length === 0) {
    return null;
  }

  const handleInputChange = (
    contactIndex: number,
    key: keyof VCard4,
    value: string,
  ) => {
    const updatedContacts = [...editableContacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      [key]: [{ value }],
    };
    setEditableContacts(updatedContacts);
  };

  const renderInput = (
    contactIndex: number,
    key: keyof VCard4,
    value: any,
  ): JSX.Element => {
    const inputType = fieldTypes[key] || 'text';
    const inputValue = valueToString(value);

    if (inputType === 'textarea') {
      return (
        <textarea
          className="w-1/2 border rounded-md p-1 text-white"
          value={inputValue}
          onChange={(e) => handleInputChange(contactIndex, key, e.target.value)}
        />
      );
    }

    return (
      <input
        type={inputType}
        className="w-1/2 border rounded-md p-1 text-white"
        value={inputValue}
        onChange={(e) => handleInputChange(contactIndex, key, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-6 text-gray-800">
      <h2 className="text-2xl font-medium text-gray-900">
        Merged Contacts Preview
      </h2>
      <p className="text-base text-gray-500">
        Showing {indexOfFirstContact + 1}-
        {Math.min(indexOfLastContact, editableContacts.length)} of{' '}
        {editableContacts.length} contacts
      </p>
      <div className="space-y-4">
        {currentContacts.map((contact, index) => {
          const globalIndex = indexOfFirstContact + index;
          return (
            <div key={globalIndex} className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`contact-${globalIndex}`}
                  checked={selectedContacts.has(globalIndex)}
                  onChange={(e) =>
                    onSelectionChange(globalIndex, e.target.checked)
                  }
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`contact-${globalIndex}`}
                  className="font-medium text-gray-700"
                >
                  Include in export
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(contact).map(([key, value]) => {
                  if (mandatoryFields.includes(key as keyof VCard4))
                    return null;
                  if (hiddenFields.includes(key as keyof VCard4)) return null;

                  return (
                    <div key={key} className="flex">
                      <span className="font-medium w-1/2">{key}:</span>
                      {renderInput(globalIndex, key as keyof VCard4, value)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50 bg-white hover:bg-gray-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded-md disabled:opacity-50 bg-white hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ContactPreview;
