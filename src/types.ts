export interface Contact {
  [key: string]: string;
}

export interface ParsedFile {
  name: string;
  contacts: Contact[];
}