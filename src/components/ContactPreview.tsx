import React, { useState } from 'react';
import { Contact } from '../types';

interface ContactPreviewProps {
  contacts: Contact[];
  selectedContacts: Set<number>;
  onSelectionChange: (index: number, isSelected: boolean) => void;
}

const ContactPreview: React.FC<ContactPreviewProps> = ({ contacts, selectedContacts, onSelectionChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);

  const totalPages = Math.ceil(contacts.length / contactsPerPage);

  const mandatoryFields = ['BEGIN', 'END', 'VERSION'];

  if (contacts.length === 0) {
    return null;
  }

  const renderValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(v => renderValue(v)).join(', ');
    } else if (typeof value === 'object' && value !== null) {
      if ('value' in value) {
        return Array.isArray(value.value) ? value.value.join(', ') : String(value.value);
      } else {
        return JSON.stringify(value);
      }
    } else {
      return String(value);
    }
  };

  return (
    <div className="space-y-6 text-gray-800">
      <h2 className="text-2xl font-medium text-gray-900">Merged Contacts Preview</h2>
      <p className="text-base text-gray-500">
        Showing {indexOfFirstContact + 1}-{Math.min(indexOfLastContact, contacts.length)} of {contacts.length} contacts
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
                  onChange={(e) => onSelectionChange(globalIndex, e.target.checked)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`contact-${globalIndex}`} className="font-medium text-gray-700">
                  Include in export
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(contact).map(([key, value]) => {
                  if (mandatoryFields.includes(key)) return null;
                  return (
                    <div key={key} className="flex">
                      <span className="font-medium w-1/2">{key}:</span>
                      <span className="w-1/2">{renderValue(value)}</span>
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