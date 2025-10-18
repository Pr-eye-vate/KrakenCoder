import { 
  type File, 
  type InsertFile,
  type ChatMessage,
  type InsertChatMessage,
  type TerminalSession,
  type InsertTerminalSession
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // File operations
  getFile(path: string): Promise<File | undefined>;
  getFiles(): Promise<File[]>;
  getFilesByParent(parentPath: string | null): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFileContent(path: string, content: string): Promise<File | undefined>;
  deleteFile(path: string): Promise<boolean>;
  renameFile(oldPath: string, newPath: string): Promise<File | undefined>;

  // Chat operations
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(sessionId: string): Promise<void>;

  // Terminal operations
  getTerminalSessions(): Promise<TerminalSession[]>;
  createTerminalSession(session: InsertTerminalSession): Promise<TerminalSession>;
  deleteTerminalSession(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private files: Map<string, File>;
  private chatMessages: ChatMessage[];
  private terminalSessions: Map<string, TerminalSession>;

  constructor() {
    this.files = new Map();
    this.chatMessages = [];
    this.terminalSessions = new Map();
    
    // Initialize with a sample file structure
    this.initializeSampleFiles();
  }

  private initializeSampleFiles() {
    const sampleFiles: File[] = [
      {
        id: randomUUID(),
        name: "src",
        path: "/src",
        content: "",
        language: "plaintext",
        isDirectory: "true",
        parentPath: null,
      },
      {
        id: randomUUID(),
        name: "index.tsx",
        path: "/src/index.tsx",
        content: `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Welcome to AI IDE</h1>
      <p>Start coding with Gemini AI assistance!</p>
    </div>
  );
}

export default App;`,
        language: "typescript",
        isDirectory: "false",
        parentPath: "/src",
      },
      {
        id: randomUUID(),
        name: "README.md",
        path: "/README.md",
        content: `# AI-Powered IDE

Built with:
- Monaco Editor
- Google Gemini Flash 2.0
- React + Express

## Features
- Smart code completion
- AI chat assistant
- Integrated terminal
- File explorer`,
        language: "markdown",
        isDirectory: "false",
        parentPath: null,
      },
    ];

    sampleFiles.forEach(file => this.files.set(file.path, file));
  }

  // File operations
  async getFile(path: string): Promise<File | undefined> {
    return this.files.get(path);
  }

  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }

  async getFilesByParent(parentPath: string | null): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.parentPath === parentPath
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = { 
      id,
      name: insertFile.name,
      path: insertFile.path,
      content: insertFile.content ?? '',
      language: insertFile.language ?? 'plaintext',
      isDirectory: insertFile.isDirectory ?? 'false',
      parentPath: insertFile.parentPath ?? null,
    };
    this.files.set(file.path, file);
    return file;
  }

  async updateFileContent(path: string, content: string): Promise<File | undefined> {
    const file = this.files.get(path);
    if (!file) return undefined;
    
    const updatedFile = { ...file, content };
    this.files.set(path, updatedFile);
    return updatedFile;
  }

  async deleteFile(path: string): Promise<boolean> {
    // Delete file and all its children
    const filesToDelete = Array.from(this.files.values()).filter(
      file => file.path === path || file.path.startsWith(path + "/")
    );
    
    filesToDelete.forEach(file => this.files.delete(file.path));
    return filesToDelete.length > 0;
  }

  async renameFile(oldPath: string, newPath: string): Promise<File | undefined> {
    const file = this.files.get(oldPath);
    if (!file) return undefined;

    // Update file path
    this.files.delete(oldPath);
    const updatedFile = { ...file, path: newPath, name: newPath.split('/').pop() || newPath };
    this.files.set(newPath, updatedFile);

    // Update children paths if it's a directory
    if (file.isDirectory === "true") {
      const children = Array.from(this.files.values()).filter(
        f => f.path.startsWith(oldPath + "/")
      );
      
      children.forEach(child => {
        const newChildPath = child.path.replace(oldPath, newPath);
        this.files.delete(child.path);
        this.files.set(newChildPath, { ...child, path: newChildPath, parentPath: newPath });
      });
    }

    return updatedFile;
  }

  // Chat operations
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages.filter(msg => msg.sessionId === sessionId);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: randomUUID(),
      content: insertMessage.content,
      role: insertMessage.role,
      sessionId: insertMessage.sessionId ?? 'default',
      timestamp: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async clearChatMessages(sessionId: string): Promise<void> {
    this.chatMessages = this.chatMessages.filter(msg => msg.sessionId !== sessionId);
  }

  // Terminal operations
  async getTerminalSessions(): Promise<TerminalSession[]> {
    return Array.from(this.terminalSessions.values());
  }

  async createTerminalSession(insertSession: InsertTerminalSession): Promise<TerminalSession> {
    const id = randomUUID();
    const session: TerminalSession = { 
      id,
      name: insertSession.name,
      isActive: insertSession.isActive ?? 'true',
    };
    this.terminalSessions.set(id, session);
    return session;
  }

  async deleteTerminalSession(id: string): Promise<boolean> {
    return this.terminalSessions.delete(id);
  }
}

export const storage = new MemStorage();
