# Design Guidelines: AI-Powered IDE (Cursor-Inspired)

## Design Approach

**Selected Approach:** Design System - Modern IDE Pattern (VS Code/Cursor-inspired) with Enhanced Visual Treatment

**Justification:** IDEs are utility-focused applications where efficiency, learnability, and consistency are critical. We'll build upon established IDE patterns (VS Code, Cursor) while elevating the visual design with immersive dark themes, subtle animations, and polished component treatments that don't compromise functionality.

**Key Design Principles:**
1. **Functional First, Beautiful Always** - Every visual element serves usability while maintaining aesthetic excellence
2. **Dark-Native Design** - Built for extended coding sessions with eye-comfort prioritized
3. **Spatial Clarity** - Clear hierarchy and zones for different tools (editor, terminal, chat, files)
4. **Intelligent Contrast** - Code readability through thoughtful syntax highlighting and background treatments

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- **Background Hierarchy:**
  - Main Editor: 220 13% 13% (deep blue-gray, code canvas)
  - Sidebar/File Tree: 220 13% 9% (darker, recessed)
  - Active Panels: 220 13% 18% (elevated for terminal, chat)
  - Hover States: 220 13% 20%
  
- **Primary Brand:**
  - Primary Accent: 262 83% 58% (vibrant purple - for AI features, active states)
  - Primary Muted: 262 50% 45% (dimmed purple for secondary actions)

- **Functional Colors:**
  - Success/Run: 142 71% 45% (green for successful operations)
  - Error/Debug: 0 84% 60% (red for errors, breakpoints)
  - Warning: 38 92% 50% (amber for warnings)
  - Info/Chat: 199 89% 48% (cyan for AI chat, info states)

- **Text Hierarchy:**
  - Primary Text: 210 20% 98% (near-white for code, headers)
  - Secondary Text: 215 20% 65% (muted for labels, metadata)
  - Tertiary Text: 215 15% 50% (subtle for hints, disabled states)

- **Syntax Highlighting Palette:**
  - Keywords: 291 64% 62% (purple-pink)
  - Strings: 142 71% 45% (green)
  - Functions: 199 89% 48% (cyan)
  - Variables: 210 20% 98% (white)
  - Comments: 215 20% 50% (gray, italic)
  - Numbers: 38 92% 70% (amber-gold)

**Light Mode (Secondary):**
- Background: 210 20% 98%
- Sidebar: 210 20% 95%
- Text: 220 13% 13%
- Accent: 262 83% 50%

### B. Typography

**Font Families:**
- **Code/Monospace:** 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace
- **UI Text:** 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Headings:** 'Inter', sans-serif (600 weight)

**Font Scales:**
- Code Editor: 14px / 1.6 line-height (comfortable for long sessions)
- Terminal: 13px / 1.5 line-height
- UI Labels: 12px / 1.4 line-height
- Headings: 16px (sidebar headers), 14px (panel titles)
- Chat Messages: 14px / 1.5 line-height

**Special Treatments:**
- Enable font ligatures for code (≥, =>, !=, etc.)
- Syntax highlighting with italic for comments and certain keywords
- Bold for active file names in tree

### C. Layout System

**Tailwind Spacing Units:** Core spacing rhythm uses 2, 4, 8, 12, 16, 24, 32
- Component padding: p-4 (standard), p-6 (panels)
- Element gaps: gap-2 (tight), gap-4 (standard), gap-6 (loose)
- Section margins: mb-4, mb-8
- Panel separators: 1px borders with opacity

**Layout Grid:**
- **Main Structure:** CSS Grid with defined areas
  - Sidebar: 280px (resizable down to 200px, up to 400px)
  - Editor: flex-1 (takes remaining space)
  - Right Panel (AI Chat): 400px (resizable, collapsible)
  - Terminal: 300px height (resizable, collapsible)

**Responsive Breakpoints:**
- Desktop: 1440px+ (optimal, all panels visible)
- Laptop: 1024px+ (compact sidebar, stackable panels)
- Tablet: 768px+ (collapsible sidebar, single panel focus)

### D. Component Library

**Navigation & Structure:**

1. **Top Menu Bar (h-12):**
   - App logo/name (left)
   - File/Edit/View/Run menus (center-left)
   - AI status indicator (center-right)
   - Settings/profile (right)
   - Background: 220 13% 9% with border-b

2. **Sidebar (File Explorer):**
   - Collapsible sections with chevron icons
   - File icons (language-specific via vscode-icons or similar)
   - Tree indentation: 16px per level
   - Hover: entire row highlights with 220 13% 20%
   - Active file: purple accent bar (4px left border) + 262 83% 58% / 0.1 background
   - Context menu on right-click

3. **Monaco Editor Area:**
   - Tab bar for open files (h-10)
   - Tab styling: rounded-t-lg, active tab elevated with lighter bg
   - Close buttons on tabs (× icon, appears on hover)
   - Editor chrome: minimal, focus on code
   - Minimap: right side (optional, toggleable)
   - Line numbers: 215 15% 50% color
   - Current line highlight: 220 13% 18%

4. **Integrated Terminal:**
   - Resizable panel (drag handle at top)
   - Multiple terminal tabs support
   - Shell selector dropdown (bash, zsh, powershell)
   - Clear/split terminal buttons
   - Background: 220 13% 11%
   - Text: monospace with ANSI color support

5. **AI Chat Panel:**
   - Message bubbles: User (right-aligned, 262 83% 58% bg), AI (left-aligned, 220 13% 18% bg)
   - Code blocks in messages: inline Monaco renderer with syntax highlighting
   - "Apply to file" buttons on AI code suggestions
   - Streaming response with typing indicator
   - Input field: sticky bottom with attachment button

6. **Settings Panel:**
   - Tabbed navigation (General, Editor, Keybindings, Extensions, AI)
   - Search bar at top
   - Toggle switches for boolean options
   - Dropdowns for selections
   - Color pickers for theme customization
   - Keyboard shortcut recorder

**Forms & Inputs:**

- **Search Bars:** rounded-lg, h-9, pl-10 (icon space), border with focus ring in accent color
- **Dropdowns:** Custom styled with chevron-down icon, max-h-64 overflow-scroll
- **Toggles:** w-11 h-6 rounded-full, purple when active
- **Buttons:**
  - Primary: purple background, white text, hover: lighten 5%
  - Secondary: outlined with border-2, purple border/text
  - Ghost: transparent, hover: 220 13% 18%
  - Icon buttons: p-2, rounded-md, hover: 220 13% 20%

**Data Display:**

- **File Tree:** Recursive component with expand/collapse, drag-drop support
- **Breadcrumbs:** Above editor showing file path, clickable segments
- **Status Bar (bottom):** 
  - Left: line/col position, language mode, encoding
  - Right: git branch, errors/warnings count, AI status
  - Height: h-6, compact info display

**Overlays & Modals:**

- **Command Palette:** 
  - Triggered by Cmd/Ctrl+K
  - Centered overlay (w-[600px])
  - Fuzzy search with keyboard navigation
  - Recent commands prioritized
  - Backdrop: 220 13% 9% / 0.8

- **Quick File Switcher:** 
  - Cmd/Ctrl+P trigger
  - Similar to command palette but file-focused
  - Shows file path and recent files

- **Settings Modal:**
  - Full-screen overlay with sidebar navigation
  - Close button (top-right)
  - Apply/Cancel actions

**Animations:**

Use sparingly and purposefully:
- Panel resize: smooth CSS transitions (200ms ease-out)
- Hover states: 150ms ease-in-out
- Tab switches: fade transition (100ms)
- Command palette: scale-95 to scale-100 spring animation
- AI response streaming: cursor blink, text fade-in
- **No** distracting editor animations or excessive motion

---

## Special Features & Treatments

**AI-Powered Elements:**
- Purple glow effect (subtle box-shadow with 262 83% 58% / 0.3) on AI-active features
- Inline AI suggestions: ghost text in 215 20% 50% italic
- Code completion popup: elevated card with arrow pointing to cursor position

**Syntax Highlighting:**
- Use Monaco's built-in themes as base
- Customize with defined color palette
- Support for 20+ languages
- Bracket pair colorization enabled
- Semantic highlighting for variables

**Debug Mode:**
- Breakpoint indicators: red circles in gutter (0 84% 60%)
- Debug toolbar: floating panel with step controls
- Variable inspector: collapsible tree in sidebar
- Call stack: bottom panel integration

**Git Integration:**
- Gutter indicators: green (added), blue (modified), red (deleted)
- Diff view: side-by-side with sync scrolling
- Branch selector in status bar
- Git graph in sidebar (optional panel)

---

## Accessibility & Polish

- **Keyboard Navigation:** Full keyboard support for all actions, visible focus rings (2px purple)
- **Screen Readers:** Proper ARIA labels on all interactive elements
- **Contrast Ratios:** Minimum 4.5:1 for text, 3:1 for UI components
- **Theme Switching:** Instant toggle between light/dark with smooth transition
- **Font Scaling:** Support for 10px - 20px editor font sizes
- **Color Blind Modes:** Alternative syntax themes available

**Performance Optimizations:**
- Virtual scrolling for large files (Monaco handles this)
- Lazy load file tree nodes
- Debounce terminal output rendering
- Web Worker for AI processing

---

## Implementation Notes

- Monaco Editor: Use @monaco-editor/react with custom theme configuration
- Terminal: xterm.js with fit addon
- File Tree: Custom React component with react-arborist or similar
- Icons: Lucide React for UI, vscode-codicons for file types
- Syntax: Shiki or Monaco's built-in tokenizers
- AI Integration: Stream responses via Server-Sent Events or WebSocket
- State Management: Zustand or Context API for panels, file state
- Resizable Panels: react-resizable-panels library

This IDE design balances the functionality developers expect with a visually stunning, immersive experience that makes coding feel modern and delightful.