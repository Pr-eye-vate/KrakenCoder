import { z } from "zod";

// File System Types
export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
};

export const fileNodeSchema: z.ZodType<FileNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['file', 'folder']),
    path: z.string(),
    content: z.string().optional(),
    language: z.string().optional(),
    children: z.array(fileNodeSchema).optional(),
    isOpen: z.boolean().optional(),
  })
);

export const fileOperationSchema = z.object({
  operation: z.enum(['create', 'read', 'write', 'delete', 'rename', 'search']),
  path: z.string(),
  newPath: z.string().optional(),
  content: z.string().optional(),
  query: z.string().optional(),
  type: z.enum(['file', 'folder']).optional(),
});

export type FileOperation = z.infer<typeof fileOperationSchema>;

// Editor Tab Types
export const editorTabSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  content: z.string(),
  language: z.string(),
  isDirty: z.boolean(),
  cursorPosition: z.object({
    lineNumber: z.number(),
    column: z.number(),
  }).optional(),
});

export type EditorTab = z.infer<typeof editorTabSchema>;

// Terminal Types
export const terminalSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  cwd: z.string(),
});

export type TerminalSession = z.infer<typeof terminalSessionSchema>;

export const terminalCommandSchema = z.object({
  sessionId: z.string(),
  command: z.string(),
});

export type TerminalCommand = z.infer<typeof terminalCommandSchema>;

// AI Chat Types
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
  codeBlocks: z.array(z.object({
    language: z.string(),
    code: z.string(),
  })).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatRequestSchema = z.object({
  message: z.string(),
  context: z.object({
    currentFile: z.string().optional(),
    selectedCode: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Code Completion Types
export const completionRequestSchema = z.object({
  code: z.string(),
  language: z.string(),
  position: z.object({
    lineNumber: z.number(),
    column: z.number(),
  }),
  context: z.string().optional(),
});

export type CompletionRequest = z.infer<typeof completionRequestSchema>;

export const completionResponseSchema = z.object({
  suggestions: z.array(z.object({
    text: z.string(),
    displayText: z.string(),
    kind: z.string(),
  })),
});

export type CompletionResponse = z.infer<typeof completionResponseSchema>;

// Settings Types
export const settingsSchema = z.object({
  theme: z.enum(['dark', 'light']),
  fontSize: z.number().min(10).max(24),
  fontFamily: z.string(),
  aiModel: z.enum(['gpt-5', 'gpt-4o']),
  autoSave: z.boolean(),
  formatOnSave: z.boolean(),
  minimap: z.boolean(),
  lineNumbers: z.boolean(),
  wordWrap: z.boolean(),
  tabSize: z.number().min(2).max(8),
});

export type Settings = z.infer<typeof settingsSchema>;

// Search Types
export const searchRequestSchema = z.object({
  query: z.string(),
  caseSensitive: z.boolean().optional(),
  regex: z.boolean().optional(),
  includePattern: z.string().optional(),
  excludePattern: z.string().optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const searchResultSchema = z.object({
  path: z.string(),
  matches: z.array(z.object({
    line: z.number(),
    column: z.number(),
    text: z.string(),
    preview: z.string(),
  })),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

// Keep existing user schema for compatibility
export const users = {
  id: '',
  username: '',
  password: '',
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
