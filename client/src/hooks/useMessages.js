import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.js';
import { useChatStore } from '../store/chatStore.js';

export function useMessages(conversationId) {
  const { setMessages } = useChatStore();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await conversationsApi.messages(conversationId);
      setMessages(res.data.messages);
      return res.data;
    },
    enabled: !!conversationId,
  });
}
