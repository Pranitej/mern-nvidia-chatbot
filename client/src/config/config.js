export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL ?? '',
    timeout: 30_000,
  },
  chat: {
    maxMessageLength: 4000,
    streamThrottleMs: 30,
  },
  ui: {
    defaultTheme: 'dark',
    sidebarWidth: 260,
  },
  models: {
    available: [
      {
        id: 'deepseek-ai/deepseek-v3.1',
        label: 'DeepSeek V3.1',
        description: '685B general-purpose model',
        contextWindow: 65536,
        tags: ['fast', 'general'],
      },
{
        id: 'meta/llama-3.3-70b-instruct',
        label: 'Llama 3.3 70B',
        description: "Meta's latest 70B instruct model",
        contextWindow: 131072,
        tags: ['fast', 'general'],
      },
{
        id: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        label: 'Nemotron Super 49B',
        description: 'NVIDIA-optimized 49B efficiency model',
        contextWindow: 131072,
        tags: ['fast', 'efficient'],
      },
    ],
  },
};
