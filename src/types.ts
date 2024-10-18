import type { VCard4 } from 'vcard4-ts';

export interface ParsedFile {
  name: string;
  contacts: VCard4[];
}
