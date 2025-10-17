import { FileNode, Settings } from "@shared/schema";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Storage interface for IDE
export interface IStorage {
  // File operations
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  createFile(filePath: string, type: 'file' | 'folder'): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  getFileTree(rootPath: string): Promise<FileNode[]>;
  searchFiles(query: string, rootPath: string): Promise<Array<{ path: string; matches: any[] }>>;

  // Settings
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

export class MemStorage implements IStorage {
  private files: Map<string, string>;
  private settings: Settings;
  private baseDir: string;

  constructor() {
    this.files = new Map();
    this.baseDir = process.cwd() + '/workspace';
    this.settings = {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
      aiModel: 'gpt-5',
      autoSave: true,
      formatOnSave: false,
      minimap: true,
      lineNumbers: true,
      wordWrap: true,
      tabSize: 2,
    };

    // Initialize with some default files in memory
    this.initializeDefaultFiles();
  }

  private initializeDefaultFiles() {
    this.files.set('/src/App.tsx', `import { useState } from 'react';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="App">\n      <h1>Welcome to CodeForge IDE</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nexport default App;\n`);
    
    this.files.set('/src/index.tsx', `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`);
    
    this.files.set('/package.json', `{\n  "name": "my-project",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}\n`);
    
    this.files.set('/README.md', `# My Project\n\nWelcome to your new project!\n\n## Getting Started\n\n1. Install dependencies: \`npm install\`\n2. Start the dev server: \`npm run dev\`\n3. Open your browser and start coding!\n\n## Features\n\n- Fast development with Vite\n- React 18\n- TypeScript support\n`);
  }

  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  async createFile(filePath: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'file') {
      this.files.set(filePath, '');
    } else {
      // Create a marker file for the folder so it appears in the tree
      // Use a special path that won't conflict with actual files
      this.files.set(filePath + '/.folder', '');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    // Delete file and any children
    const keysToDelete = Array.from(this.files.keys()).filter(key => 
      key === filePath || key.startsWith(filePath + '/')
    );
    keysToDelete.forEach(key => this.files.delete(key));
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const content = this.files.get(oldPath);
    if (content !== undefined) {
      this.files.delete(oldPath);
      this.files.set(newPath, content);
    }

    // Rename any children
    const keysToRename = Array.from(this.files.keys()).filter(key => 
      key.startsWith(oldPath + '/')
    );
    keysToRename.forEach(key => {
      const content = this.files.get(key)!;
      const newKey = key.replace(oldPath, newPath);
      this.files.delete(key);
      this.files.set(newKey, content);
    });
  }

  async getFileTree(rootPath: string = '/'): Promise<FileNode[]> {
    const tree: Map<string, FileNode> = new Map();
    
    // Build tree structure
    const fileEntries = Array.from(this.files.entries());
    for (const [filePath, content] of fileEntries) {
      // Process folder markers to create empty folders
      if (filePath.endsWith('/.folder')) {
        const folderPath = filePath.substring(0, filePath.length - 8); // Remove '/.folder'
        if (!tree.has(folderPath)) {
          const parts = folderPath.split('/').filter(Boolean);
          const name = parts[parts.length - 1] || '';
          
          const node: FileNode = {
            id: randomUUID(),
            name,
            type: 'folder',
            path: folderPath,
            children: [],
          };
          tree.set(folderPath, node);
          
          // Add to parent
          const parentPath = parts.slice(0, -1).join('/');
          if (parentPath) {
            const fullParentPath = '/' + parentPath;
            const parent = tree.get(fullParentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
        continue;
      }
      
      const parts = filePath.split('/').filter(Boolean);
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath + '/' + part;
        
        if (!tree.has(currentPath)) {
          const isFile = i === parts.length - 1;
          const node: FileNode = {
            id: randomUUID(),
            name: part,
            type: isFile ? 'file' : 'folder',
            path: currentPath,
            content: isFile ? content : undefined,
            language: isFile ? this.getLanguageFromPath(currentPath) : undefined,
            children: isFile ? undefined : [],
          };
          tree.set(currentPath, node);
          
          // Add to parent's children
          if (parentPath) {
            const parent = tree.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      }
    }
    
    // Return root level nodes
    const rootNodes: FileNode[] = [];
    const treeEntries = Array.from(tree.entries());
    for (const [path, node] of treeEntries) {
      const depth = path.split('/').filter(Boolean).length;
      if (depth === 1) {
        rootNodes.push(node);
      }
    }
    
    return rootNodes;
  }

  async searchFiles(query: string, rootPath: string = '/'): Promise<Array<{ path: string; matches: any[] }>> {
    const results: Array<{ path: string; matches: any[] }> = [];
    const searchRegex = new RegExp(query, 'gi');
    
    const fileEntries = Array.from(this.files.entries());
    for (const [filePath, content] of fileEntries) {
      if (!filePath.startsWith(rootPath)) continue;
      
      const matches: any[] = [];
      const lines = content.split('\n');
      
      lines.forEach((line: string, index: number) => {
        if (searchRegex.test(line)) {
          matches.push({
            line: index + 1,
            column: line.search(searchRegex),
            text: line,
            preview: line.trim(),
          });
        }
      });
      
      if (matches.length > 0) {
        results.push({ path: filePath, matches });
      }
    }
    
    return results;
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async saveSettings(settings: Settings): Promise<void> {
    this.settings = { ...settings };
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.json': 'json',
      '.md': 'markdown',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
    };
    return languageMap[ext] || 'plaintext';
  }
}

export const storage = new MemStorage();
