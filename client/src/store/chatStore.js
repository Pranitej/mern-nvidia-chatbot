import { create } from 'zustand';
import { config } from '../config/config.js';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',
  selectedModelId: config.models.available[0].id,
  setSelectedModelId: (id) => set({ selectedModelId: id }),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conv) => set(s => ({
    conversations: [conv, ...s.conversations],
    activeConversationId: conv._id,
  })),

  removeConversation: (id) => set(s => ({
    conversations: s.conversations.filter(c => c._id !== id),
    activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    messages: s.activeConversationId === id ? [] : s.messages,
  })),

  updateConversationTitle: (id, title) => set(s => ({
    conversations: s.conversations.map(c => c._id === id ? { ...c, title } : c),
  })),

  setActiveConversation: (id) => set(s =>
    s.activeConversationId === id
      ? s
      : { activeConversationId: id, messages: [], streamingContent: '', streamingReasoning: '' }
  ),

  setMessages: (messages) => set({ messages }),

  addUserMessage: (message) => set(s => ({ messages: [...s.messages, message] })),

  startStreaming: () => set({ isStreaming: true, streamingContent: '', streamingReasoning: '' }),

  appendToken: (token) => set(s => ({ streamingContent: s.streamingContent + token })),

  appendReasoning: (chunk) => set(s => ({ streamingReasoning: s.streamingReasoning + chunk })),

  finalizeStream: (messageId, tokens, model) => set(s => ({
    isStreaming: false,
    messages: [...s.messages, {
      _id: messageId,
      role: 'assistant',
      content: s.streamingContent,
      reasoning: s.streamingReasoning,
      tokens,
      model,
      createdAt: new Date().toISOString(),
    }],
    streamingContent: '',
    streamingReasoning: '',
  })),

  clearStream: () => set({ isStreaming: false, streamingContent: '', streamingReasoning: '' }),
}));
