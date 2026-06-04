'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useHttpClient } from '@/hooks/useHttpClient';

export interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: Citation[];
  isNotFound?: boolean;
}

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChat() {
  const api = useHttpClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generate UUID on mount (client-side only)
    setSessionId(generateUUID());
  }, []);

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      return api.post<{ answer: string; citations: Citation[] }>('/chat/query', {
        query,
        sessionId,
      });
    },
  });

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    // 1. Add user message to list
    const userMessageId = generateUUID();
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // 2. Call mutation
      const result = await chatMutation.mutateAsync(query);

      // Check if answer contains "not found in documents" or isNotFound based on empty citations/not found keyword
      const answerLower = result.answer.toLowerCase();
      const isNotFound =
        answerLower.includes('not found in documents') ||
        answerLower.includes('cannot find the answer') ||
        result.citations.length === 0;

      const aiMsg: ChatMessage = {
        id: generateUUID(),
        sender: 'ai',
        text: result.answer,
        citations: result.citations,
        isNotFound,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      // Handle error by putting an error message in chat thread
      const aiMsg: ChatMessage = {
        id: generateUUID(),
        sender: 'ai',
        text: err?.message || 'Sorry, something went wrong while processing your request.',
        citations: [],
        isNotFound: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(generateUUID());
  };

  return {
    messages,
    sendMessage,
    isPending: chatMutation.isPending,
    error: chatMutation.error,
    clearChat,
    sessionId,
  };
}
