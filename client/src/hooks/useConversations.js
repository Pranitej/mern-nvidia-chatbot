import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.js';
import { useChatStore } from '../store/chatStore.js';

export function useConversations() {
  const { setConversations, addConversation, removeConversation, updateConversationTitle } = useChatStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await conversationsApi.list();
      setConversations(res.data.conversations);
      return res.data;
    },
  });

  const create = useMutation({
    mutationFn: (data) => conversationsApi.create(data),
    onSuccess: (res) => {
      addConversation(res.data.conversation);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const rename = useMutation({
    mutationFn: ({ id, title }) => conversationsApi.rename(id, title),
    onSuccess: (res) => {
      updateConversationTitle(res.data.conversation._id, res.data.conversation.title);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => conversationsApi.remove(id),
    onSuccess: (_, id) => {
      removeConversation(id);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return { ...query, create, rename, remove };
}
