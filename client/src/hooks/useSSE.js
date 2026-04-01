import { useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore.js';

export function useSSE() {
  const { startStreaming, appendToken, appendReasoning, finalizeStream, clearStream } = useChatStore();
  const abortControllerRef = useRef(null);
  const generationRef = useRef(0);

  const stream = useCallback(async (conversationId, content, model) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const generation = ++generationRef.current;
    startStreaming();

    try {
      const res = await fetch(`/api/ai/stream/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, model }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Stream request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch (_) { continue; }
          if (event.type === 'token')     appendToken(event.content);
          if (event.type === 'reasoning') appendReasoning(event.content);
          if (event.type === 'done')      finalizeStream(event.messageId, event.tokens, event.model);
          if (event.type === 'error')     throw new Error(event.message);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (generationRef.current === generation) clearStream();
        return;
      }
      clearStream();
      throw err;
    }
  }, [startStreaming, appendToken, appendReasoning, finalizeStream, clearStream]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { stream, abort };
}
