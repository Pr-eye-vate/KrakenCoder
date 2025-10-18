# CodeForge IDE

## Overview

CodeForge is an AI-powered Integrated Development Environment (IDE) inspired by Cursor and VS Code. It provides a modern code editing experience with integrated AI assistance powered by Google's Gemini AI. The application features a Monaco-based code editor, file management system, AI chat interface, and terminal integration, all built with a focus on developer productivity and a polished dark-mode-first design.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 18, 2025 - IDE Improvements
- **Resizable Panels**: Implemented react-resizable-panels throughout the IDE for better workspace customization
  - File explorer, editor, and chat panels are now horizontally resizable
  - Terminal panel is vertically resizable within the editor area
  - All panels have appropriate min/max size constraints
- **Editor State Management Fix**: Fixed critical bug where Monaco editor couldn't persist user edits
  - Editor now uses local state (editorContent) as the controlled value
  - Added useEffect to sync content when switching files
  - Fixed cache invalidation to update both collection and file-specific queries
- **TypeScript Improvements**: Resolved type safety issues in storage.ts
  - Properly handle optional fields in createFile, createChatMessage, and createTerminalSession
  - Fixed apiRequest call signature in IDE component
- **UI/UX Enhancements**:
  - Better scrollbar visibility in file explorer and chat
  - Improved visual feedback for selected files
  - Fixed layout issues with proper shrink-0 classes on headers/footers
- **Gemini AI Integration**: Configured GEMINI_API_KEY secret for AI chat functionality

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing

**UI Component System:**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system tokens
- Class Variance Authority (CVA) for component variant management
- Design system follows VS Code/Cursor IDE patterns with enhanced visual treatment

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local React state for UI-specific interactions
- No global state management library - relies on React Query for data synchronization

**Code Editor:**
- Monaco Editor (via @monaco-editor/react) - the same editor that powers VS Code
- Provides syntax highlighting, IntelliSense, and code formatting capabilities
- Supports multiple programming languages with automatic language detection

**Design Philosophy:**
- Dark-native design optimized for extended coding sessions
- Spatial clarity with distinct zones for editor, file tree, terminal, and chat
- Purple-based accent colors (262 83% 58%) for AI features and active states
- Hierarchical backgrounds using blue-gray tones for depth perception

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- Node.js runtime with ES modules
- Custom Vite middleware integration for development mode

**API Design:**
- RESTful endpoints for file operations (`/api/files`)
- Streaming endpoints for AI chat responses
- File operations: read, write, create, delete, rename, search

**AI Integration:**
- Google Gemini AI (via @google/genai package) - specifically using gemini-2.5-flash model
- Streaming responses for real-time chat interactions
- Context-aware assistance with current file, selected code, and language information
- Conversation history maintained for contextual responses

**File Management:**
- In-memory file storage (MemStorage class) for development/demo purposes
- File tree structure with hierarchical organization
- Support for multiple file types with language detection

### Data Storage Solutions

**Database:**
- PostgreSQL database via Neon serverless (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and migrations
- Schema includes:
  - `files` table: stores file metadata and content
  - `chatMessages` table: stores AI conversation history
  - `terminalSessions` table: manages terminal session state

**Schema Design:**
- Files support directory structures with parent-child relationships
- Chat messages include role (user/assistant), content, timestamp, and session ID
- All tables use UUID primary keys for global uniqueness

**Storage Pattern:**
- Hybrid approach: MemStorage for rapid development, PostgreSQL for production persistence
- IStorage interface allows switching between storage implementations
- File operations abstracted behind interface for flexibility

### External Dependencies

**AI Service:**
- Google Gemini AI API
  - Model: gemini-2.5-flash (optimized for performance)
  - API Key authentication via environment variable
  - Streaming responses for real-time interaction
  - Context-aware code assistance with file and selection awareness

**Database Service:**
- Neon Serverless PostgreSQL
  - WebSocket-based connection for serverless environments
  - Connection pooling via @neondatabase/serverless
  - DATABASE_URL environment variable for configuration

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- Monaco Editor for professional code editing experience
- Multiple Radix components: Dialog, Dropdown, Popover, Toast, Tabs, etc.

**Development Tools:**
- Replit-specific plugins for development environment integration
- Vite plugins: cartographer, dev-banner, runtime-error-modal
- TypeScript for type safety across entire stack

**Font Stack:**
- Google Fonts: Architects Daughter, DM Sans, Fira Code, Geist Mono
- Monospace fonts for code display and terminal

**Session Management:**
- connect-pg-simple for PostgreSQL-backed session storage
- Express session middleware for authentication state