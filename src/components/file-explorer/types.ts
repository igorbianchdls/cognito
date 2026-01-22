export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
};

export type OpenFile = {
  path: string;
  name: string;
  content: string;
  language: string;
  dirty?: boolean;
};

