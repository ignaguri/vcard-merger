import { saveAs } from 'file-saver';
import type { VCard4 } from 'vcard4-ts';
import { parseVCards } from 'vcard4-ts';

export const parseVCard = async (file: File): Promise<VCard4[]> => {
  const text = await file.text();
  const parsedCards = parseVCards(text);

  if (parsedCards.nags) {
    parsedCards.nags.forEach((nag) => {
      if (nag.isError) {
        console.error(`Error: ${nag.description}`);
      } else {
        console.warn(`Warning: ${nag.description}`);
      }
    });
  }

  return parsedCards.vCards || [];
};

const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const mergeContacts = (
  contacts1: VCard4[],
  contacts2: VCard4[],
  fieldMappings: Record<keyof VCard4, keyof VCard4>,
): VCard4[] => {
  const mergedContacts: VCard4[] = [];
  const processedIndices = new Set<number>();

  contacts1.forEach((contact1) => {
    const matchingContactIndex = contacts2.findIndex((contact2, index2) => {
      if (processedIndices.has(index2)) return false;

      const nameMatch = contact1.FN?.[0]?.value === contact2.FN?.[0]?.value;
      const phoneMatch =
        contact1.TEL &&
        contact2.TEL &&
        normalizePhoneNumber(contact1.TEL[0].value) ===
          normalizePhoneNumber(contact2.TEL[0].value);

      return nameMatch || phoneMatch;
    });

    if (matchingContactIndex !== -1) {
      const matchingContact = contacts2[matchingContactIndex];
      const mergedContact: VCard4 = { ...contact1 };

      Object.entries(fieldMappings).forEach(([field1, field2]) => {
        const value = matchingContact[field2 as keyof VCard4];
        if (value !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mergedContact[field1 as keyof VCard4] = value as any;
        }
      });

      processedIndices.add(matchingContactIndex);
      mergedContacts.push(mergedContact);
    } else {
      mergedContacts.push(contact1);
    }
  });

  contacts2.forEach((contact2, index2) => {
    if (!processedIndices.has(index2)) {
      mergedContacts.push(contact2);
    }
  });

  return mergedContacts;
};

export const exportVCard = (contacts: VCard4[]): void => {
  let vCardContent = '';
  contacts.forEach((contact) => {
    vCardContent += 'BEGIN:VCARD\n';
    vCardContent += 'VERSION:4.0\n';
    Object.entries(contact).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value.forEach((item: any) => {
          vCardContent += `${key}:${item.value}\n`;
        });
      } else if (typeof value === 'object' && value !== null) {
        vCardContent += `${key}:${value.value}\n`;
      }
    });
    vCardContent += 'END:VCARD\n';
  });

  const blob = new Blob([vCardContent], { type: 'text/vcard' });
  saveAs(blob, 'contacts.vcf');
};

export const exportCSV = (contacts: VCard4[]): void => {
  let csvContent = 'Name,Email,Phone,Address\n';
  contacts.forEach((contact) => {
    const name = contact.FN[0]?.value[0] || '';
    const email = contact.EMAIL?.[0]?.value || '';
    const phone = contact.TEL?.[0]?.value || '';
    const address = contact.ADR?.[0]
      ? [
          contact.ADR[0].value.postOfficeBox,
          contact.ADR[0].value.extendedAddress,
          contact.ADR[0].value.streetAddress,
          contact.ADR[0].value.locality,
          contact.ADR[0].value.region,
          contact.ADR[0].value.postalCode,
          contact.ADR[0].value.countryName,
        ]
          .filter(Boolean)
          .join(', ')
      : '';
    csvContent += `"${name}","${email}","${phone}","${address}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(blob, 'contacts.csv');
};
