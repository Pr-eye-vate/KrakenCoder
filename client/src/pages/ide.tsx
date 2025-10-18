import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  Plus,
  Terminal as TerminalIcon,
  MessageSquare,
  Sparkles,
  X,
  Send,
} from 'lucide-react';
import type { File as FileType, ChatMessage } from '@shared/schema';

export default function IDE() {
  const [selectedFile, setSelectedFile] = useState<string | null>('/src/index.tsx');
  const [editorContent, setEditorContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src']));
  const [showTerminal, setShowTerminal] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch files
  const { data: files = [] } = useQuery<FileType[]>({
    queryKey: ['/api/files'],
  });

  // Fetch current file content
  const { data: currentFile } = useQuery<FileType>({
    queryKey: ['/api/files', selectedFile],
    enabled: !!selectedFile,
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', 'default'],
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return apiRequest('PATCH', `/api/files/${encodeURIComponent(path)}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsStreaming(true);
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId: 'default' }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                return;
              }
            }
          }
        }
      }
      setIsStreaming(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', 'default'] });
      setChatInput('');
    },
  });

  // Handle file selection
  const handleFileSelect = (file: FileType) => {
    if (file.isDirectory === 'false') {
      setSelectedFile(file.path);
      setEditorContent(file.content);
    }
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Render file tree
  const renderFileTree = (parentPath: string | null, level: number = 0) => {
    const childFiles = files.filter(f => f.parentPath === parentPath);
    
    return childFiles.map(file => {
      const isDirectory = file.isDirectory === 'true';
      const isExpanded = expandedFolders.has(file.path);
      const isSelected = selectedFile === file.path;

      return (
        <div key={file.path}>
          <div
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover-elevate active-elevate-2 rounded-md ${
              isSelected ? 'bg-primary/10' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => isDirectory ? toggleFolder(file.path) : handleFileSelect(file)}
            data-testid={`file-${file.path}`}
          >
            {isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Folder className="w-4 h-4 text-primary" />
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="w-4 h-4 text-muted-foreground" />
              </>
            )}
            <span className={`text-sm ${isSelected ? 'font-semibold text-primary' : ''}`}>
              {file.name}
            </span>
          </div>
          {isDirectory && isExpanded && renderFileTree(file.path, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* Top Bar */}
      <div className="h-12 bg-card border-b border-card-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">AI IDE</h1>
          <span className="text-xs text-muted-foreground">powered by Gemini Flash 2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowTerminal(!showTerminal)}
            data-testid="button-toggle-terminal"
          >
            <TerminalIcon className="w-4 h-4 mr-1" />
            Terminal
          </Button>
        </div>
      </div>

      {/* Main Content Area with Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar - File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border shrink-0">
              <h2 className="text-sm font-semibold">Explorer</h2>
              <Button size="icon" variant="ghost" data-testid="button-new-file">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {renderFileTree(null)}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center - Editor Area */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Editor Tab Bar */}
            {selectedFile && (
              <div className="h-10 bg-card border-b border-card-border flex items-center px-2 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-t-md border-t border-x border-border">
                  <File className="w-3 h-3" />
                  <span className="text-sm" data-testid="text-current-file">
                    {selectedFile.split('/').pop()}
                  </span>
                </div>
              </div>
            )}

            {/* Editor and Terminal Container */}
            <ResizablePanelGroup direction="vertical" className="flex-1">
              {/* Monaco Editor */}
              <ResizablePanel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                <div className="h-full">
                  <Editor
                    height="100%"
                    language={currentFile?.language || 'typescript'}
                    value={currentFile?.content || editorContent}
                    onChange={(value) => {
                      setEditorContent(value || '');
                      if (selectedFile && value !== undefined) {
                        updateFileMutation.mutate({ path: selectedFile, content: value });
                      }
                    }}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: true },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      fontLigatures: true,
                    }}
                  />
                </div>
              </ResizablePanel>

              {/* Terminal Panel */}
              {showTerminal && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
                    <div className="h-full bg-card flex flex-col">
                      <div className="h-10 border-b border-card-border flex items-center justify-between px-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <TerminalIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">Terminal</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setShowTerminal(false)}
                          data-testid="button-close-terminal"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-4 font-mono text-sm">
                          <div className="text-muted-foreground">
                            $ Terminal integration coming soon...
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - AI Chat */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-card border-l border-card-border flex flex-col">
            <div className="h-12 border-b border-card-border flex items-center justify-between px-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Start a conversation with the AI assistant
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.role}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="border-t border-card-border p-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim() && !isStreaming) {
                    sendMessageMutation.mutate(chatInput);
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask AI anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isStreaming}
                  data-testid="input-chat"
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!chatInput.trim() || isStreaming}
                  data-testid="button-send-chat"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
