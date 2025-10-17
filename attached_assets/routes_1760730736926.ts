import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { exec } from "child_process";
import { storage } from "./storage";
import { 
  generateChatResponse,
  generateChatResponseStream,
  generateCodeCompletion, 
  formatCode,
  type ChatContext 
} from "./lib/openai";
import { 
  fileOperationSchema, 
  chatRequestSchema, 
  completionRequestSchema,
  searchRequestSchema,
  terminalCommandSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // File Operations
  app.get("/api/files", async (req, res) => {
    try {
      const tree = await storage.getFileTree('/');
      res.json(tree);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/read", async (req, res) => {
    try {
      const { path } = req.query;
      if (typeof path !== 'string') {
        return res.status(400).json({ error: 'Path is required' });
      }
      
      const content = await storage.readFile(path);
      res.json({ content });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.post("/api/files/write", async (req, res) => {
    try {
      const validated = fileOperationSchema.parse(req.body);
      
      if (validated.operation !== 'write' || !validated.content) {
        return res.status(400).json({ error: 'Invalid write operation' });
      }

      await storage.writeFile(validated.path, validated.content);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files/create", async (req, res) => {
    try {
      const validated = fileOperationSchema.parse(req.body);
      
      if (validated.operation !== 'create' || !validated.type) {
        return res.status(400).json({ error: 'Invalid create operation' });
      }

      await storage.createFile(validated.path, validated.type);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files/delete", async (req, res) => {
    try {
      const validated = fileOperationSchema.parse(req.body);
      
      if (validated.operation !== 'delete') {
        return res.status(400).json({ error: 'Invalid delete operation' });
      }

      await storage.deleteFile(validated.path);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files/rename", async (req, res) => {
    try {
      const validated = fileOperationSchema.parse(req.body);
      
      if (validated.operation !== 'rename' || !validated.newPath) {
        return res.status(400).json({ error: 'Invalid rename operation' });
      }

      await storage.renameFile(validated.path, validated.newPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files/search", async (req, res) => {
    try {
      const validated = searchRequestSchema.parse(req.body);
      const results = await storage.searchFiles(validated.query);
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Chat with true OpenAI streaming
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const validated = chatRequestSchema.parse(req.body);
      
      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const context: ChatContext | undefined = validated.context ? {
        currentFile: validated.context.currentFile,
        selectedCode: validated.context.selectedCode,
        language: validated.context.language,
      } : undefined;

      const messageId = Date.now().toString();
      let accumulatedContent = '';
      
      // Stream chunks as they arrive from OpenAI with conversation history
      const history = validated.conversationHistory || [];
      for await (const chunk of generateChatResponseStream(validated.message, context, history)) {
        accumulatedContent += chunk;
        
        const chunkData = {
          id: messageId,
          role: 'assistant',
          content: accumulatedContent,
          timestamp: Date.now(),
        };
        
        res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Code Completion
  app.post("/api/ai/complete", async (req, res) => {
    try {
      const validated = completionRequestSchema.parse(req.body);
      
      const suggestions = await generateCodeCompletion(
        validated.code,
        validated.language,
        validated.position,
        validated.context
      );

      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Code Formatting
  app.post("/api/ai/format", async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      const formatted = await formatCode(code, language);
      res.json({ formatted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      await storage.saveSettings(req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Terminal Command Execution (simple version)
  app.post("/api/terminal/execute", async (req, res) => {
    try {
      const validated = terminalCommandSchema.parse(req.body);
      
      exec(validated.command, { timeout: 30000 }, (error, stdout, stderr) => {
        res.json({
          output: stdout + stderr,
          error: error?.message,
          exitCode: error?.code || 0,
        });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket for real-time terminal
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/terminal' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Terminal WebSocket connected');

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'command') {
          exec(message.command, { timeout: 30000 }, (error, stdout, stderr) => {
            ws.send(JSON.stringify({
              type: 'output',
              sessionId: message.sessionId,
              output: stdout + stderr,
              error: error?.message,
            }));
          });
        }
      } catch (error: any) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message,
        }));
      }
    });

    ws.on('close', () => {
      console.log('Terminal WebSocket disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
