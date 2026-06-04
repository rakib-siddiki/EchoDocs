'use client';

import { useState, useEffect } from 'react';
import { getCookie, setCookie } from '@/lib/auth-utils';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Generate UUID on mount (client-side only)
    setSessionId(generateUUID());
  }, []);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    setError(null);
    setIsPending(true);

    // 1. Add user message to list
    const userMessageId = generateUUID();
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Add empty placeholder AI message bubble
    const aiMessageId = generateUUID();
    const aiMsg: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      citations: [],
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      let token = getCookie('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const url = `${baseUrl}/chat/query/stream`;

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, sessionId }),
      });

      // Handle token expiration/rotation refresh
      if (
        response.status === 401 &&
        url.indexOf('/auth/login') === -1 &&
        url.indexOf('/auth/register') === -1
      ) {
        try {
          const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newToken = data.token;

            setCookie('token', newToken, 1);
            token = newToken;

            // Retry request with new token
            response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ query, sessionId }),
            });
          }
        } catch (refreshErr) {
          console.error('Failed to auto-refresh token during stream fetch:', refreshErr);
        }
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_) {
          try {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          } catch (__) {}
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let lineEndIdx;
          while ((lineEndIdx = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, lineEndIdx).trim();
            buffer = buffer.slice(lineEndIdx + 1);

            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'token') {
                  fullText += event.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId ? { ...msg, text: fullText } : msg
                    )
                  );
                } else if (event.type === 'citations') {
                  const hasNoCitations = event.citations.length === 0;
                  const answerLower = fullText.toLowerCase();
                  const isNotFound =
                    answerLower.includes('not found in documents') ||
                    answerLower.includes('cannot find the answer') ||
                    hasNoCitations;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, citations: event.citations, isNotFound }
                        : msg
                    )
                  );
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'Stream processing error');
                }
              } catch (e: unknown) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                if (errorMsg.includes('Stream processing error')) {
                  throw e;
                }
                console.warn('Failed to parse SSE JSON line:', jsonStr, e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sorry, something went wrong while processing your request.';
      setError(err instanceof Error ? err : new Error(String(err)));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: errorMessage,
                citations: [],
                isNotFound: true,
              }
            : msg
        )
      );
    } finally {
      setIsPending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(generateUUID());
    setError(null);
  };

  return {
    messages,
    sendMessage,
    isPending,
    error,
    clearChat,
    sessionId,
  };
}
