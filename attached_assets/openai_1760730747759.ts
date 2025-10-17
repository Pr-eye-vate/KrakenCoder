import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ChatContext {
  currentFile?: string;
  selectedCode?: string;
  language?: string;
}

export async function* generateChatResponseStream(
  message: string,
  context?: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncGenerator<string> {
  const systemPrompt = `You are an expert programming assistant integrated into an IDE called CodeForge. 
You help developers with:
- Understanding and explaining code
- Debugging and fixing errors
- Writing new code and features
- Code refactoring and optimization
- Best practices and design patterns

${context?.currentFile ? `Current file: ${context.currentFile}` : ''}
${context?.language ? `Language: ${context.language}` : ''}
${context?.selectedCode ? `Selected code:\n\`\`\`\n${context.selectedCode}\n\`\`\`\n` : ''}

Provide clear, concise, and helpful responses. When showing code, use proper markdown code blocks with language specification.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({ 
      role: msg.role, 
      content: msg.content 
    } as OpenAI.Chat.ChatCompletionMessageParam)),
    { role: 'user', content: message },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-5",
    messages,
    max_completion_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function generateChatResponse(
  message: string,
  context?: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of generateChatResponseStream(message, context, conversationHistory)) {
    fullResponse += chunk;
  }
  return fullResponse || 'I apologize, but I could not generate a response.';
}

export async function generateCodeCompletion(
  code: string,
  language: string,
  position: { lineNumber: number; column: number },
  contextBefore?: string
): Promise<Array<{ text: string; displayText: string; kind: string }>> {
  const prompt = `Given the following ${language} code, suggest completions at line ${position.lineNumber}, column ${position.column}:

\`\`\`${language}
${code}
\`\`\`

${contextBefore ? `Additional context:\n${contextBefore}\n` : ''}

Provide 3-5 completion suggestions as a JSON array with format:
[{ "text": "completion text", "displayText": "what to show", "kind": "variable|function|keyword|etc" }]`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: 'system', content: 'You are a code completion assistant. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1024,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Failed to parse completion response:', error);
    return [];
  }
}

export async function formatCode(code: string, language: string): Promise<string> {
  const prompt = `Format and beautify the following ${language} code according to best practices and standard style guides. Return only the formatted code without any explanations:

\`\`\`${language}
${code}
\`\`\``;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: 'system', content: 'You are a code formatter. Return only the formatted code.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 4096,
  });

  const content = response.choices[0].message.content || code;
  
  // Extract code from markdown code blocks if present
  const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)\n```/);
  return codeBlockMatch ? codeBlockMatch[1] : content.trim();
}
