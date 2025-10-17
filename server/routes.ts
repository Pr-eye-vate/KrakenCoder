import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertChatMessageSchema } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI - using gemini-2.5-flash for optimal performance
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  // File operations
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:path", async (req, res) => {
    try {
      const path = decodeURIComponent(req.params.path);
      const file = await storage.getFile(path);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const validatedData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(validatedData);
      res.json(file);
    } catch (error) {
      res.status(400).json({ error: "Invalid file data" });
    }
  });

  app.patch("/api/files/:path", async (req, res) => {
    try {
      const path = decodeURIComponent(req.params.path);
      const { content } = req.body;
      const file = await storage.updateFileContent(path, content);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/:path", async (req, res) => {
    try {
      const path = decodeURIComponent(req.params.path);
      const success = await storage.deleteFile(path);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Chat operations
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Chat streaming with Gemini
  app.post("/api/chat/stream", async (req, res) => {
    // Set up SSE headers first
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { message, sessionId = "default" } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        res.write(`data: ${JSON.stringify({ error: "Gemini API key not configured" })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Save user message
      await storage.createChatMessage({
        role: "user",
        content: message,
        sessionId,
      });

      // Get chat history for context
      const chatHistory = await storage.getChatMessages(sessionId);
      
      // Build conversation history (last 10 messages)
      const recentMessages = chatHistory.slice(-10);
      
      // Build Gemini-compatible contents array
      const contents = [
        {
          role: "user",
          parts: [{ text: message }],
        }
      ];

      const systemPrompt = `You are an AI programming assistant integrated into an IDE. 
You help users write better code, debug issues, explain concepts, and answer programming questions.
Be concise, technical, and helpful. Format code using markdown code blocks.`;

      // Stream response from Gemini
      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: contents,
      });

      let fullResponse = '';

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          // Send chunk to client
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      // Save AI response to storage
      await storage.createChatMessage({
        role: "assistant",
        content: fullResponse,
        sessionId,
      });

      // Send completion signal
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Chat streaming error:', error);
      // Send error event in SSE format
      res.write(`data: ${JSON.stringify({ error: "Failed to process chat message" })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  app.delete("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearChatMessages(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // Terminal operations
  app.get("/api/terminal/sessions", async (req, res) => {
    try {
      const sessions = await storage.getTerminalSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch terminal sessions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
