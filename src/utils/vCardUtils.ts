import { Contact, ParsedFile } from '../types';
import { saveAs } from 'file-saver';
import { parseVCards, sortByPREF } from 'vcard4-ts';

export const parseVCard = async (file: File): Promise<Contact[]> => {
  const text = await file.text();
  const parsedCards = parseVCards(text);
  
  if (parsedCards.vCards) {
    return parsedCards.vCards.map(vCard => {
      const contact: Contact = {};
      for (const [key, value] of Object.entries(vCard)) {
        if (key !== 'x' && key !== 'nags' && key !== 'unparseable') {
          contact[key] = value;
        }
      }
      return contact;
    });
  }
  
  return [];
};

const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const mergeContacts = (
  contacts1: Contact[],
  contacts2: Contact[],
  fieldMappings: Record<string, string>
): Contact[] => {
  const mergedContacts: Contact[] = [];
  const processedIndices = new Set<number>();

  contacts1.forEach((contact1, index1) => {
    const matchingContact = contacts2.findIndex((contact2, index2) => {
      if (processedIndices.has(index2)) return false;

      const nameMatch = contact1.FN?.[0]?.value[0] === contact2.FN?.[0]?.value[0];
      const phoneMatch = contact1.TEL && contact2.TEL && 
        normalizePhoneNumber(contact1.TEL[0].value) === normalizePhoneNumber(contact2.TEL[0].value);

      return nameMatch || phoneMatch;
    });

    if (matchingContact !== -1) {
      const mergedContact: Contact = { ...contact1 };
      Object.entries(fieldMappings).forEach(([field1, field2]) => {
        if (contacts2[matchingContact][field2]) {
          mergedContact[field1] = contacts2[matchingContact][field2];
        }
      });
      mergedContacts.push(mergedContact);
      processedIndices.add(matchingContact);
    } else {
      mergedContacts.push(contact1);
    }
  });

  // Add remaining unmatched contacts from contacts2
  contacts2.forEach((contact2, index2) => {
    if (!processedIndices.has(index2)) {
      mergedContacts.push(contact2);
    }
  });

  return mergedContacts;
};

export const exportVCard = (contacts: Contact[]): void => {
  let vCardContent = '';
  contacts.forEach(contact => {
    vCardContent += 'BEGIN:VCARD\n';
    vCardContent += 'VERSION:4.0\n';
    Object.entries(contact).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          vCardContent += `${key}:${item.value}\n`;
        });
      } else if (typeof value === 'object') {
        vCardContent += `${key}:${value.value}\n`;
      }
    });
    vCardContent += 'END:VCARD\n';
  });
  
  const blob = new Blob([vCardContent], { type: 'text/vcard' });
  saveAs(blob, 'contacts.vcf');
};

export const exportCSV = (contacts: Contact[]): void => {
  let csvContent = 'Name,Email,Phone,Address\n';
  contacts.forEach(contact => {
    const name = contact.FN?.[0]?.value[0] || '';
    const email = contact.EMAIL?.[0]?.value || '';
    const phone = contact.TEL?.[0]?.value || '';
    const address = contact.ADR?.[0]?.value.join(', ') || '';
    csvContent += `"${name}","${email}","${phone}","${address}"\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(blob, 'contacts.csv');
};

export { sortByPREF };