import { env } from './env.js';

export const config = {
  models: {
    default: 'deepseek-ai/deepseek-v3.1',
    available: [
      { id: 'deepseek-ai/deepseek-v3.1',                         label: 'DeepSeek V3.1 685B',      provider: 'nvidia' },
{ id: 'meta/llama-3.3-70b-instruct',                       label: 'Llama 3.3 70B',           provider: 'nvidia' },
{ id: 'nvidia/llama-3.3-nemotron-super-49b-v1',            label: 'Nemotron Super 49B',      provider: 'nvidia' },
    ],
  },
  ai: {
    maxTokens: 8192,
    temperature: 1,
    topP: 0.95,
    baseURL: 'https://integrate.api.nvidia.com/v1',
    streamTimeout: 60_000,
  },
  auth: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    bcryptRounds: 12,
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },
  rateLimit: {
    auth:   { windowMs: 60_000, max: 10 },
    api:    { windowMs: 60_000, max: 60 },
    stream: { windowMs: 60_000, max: 20 },
  },
  pagination: {
    conversationsPerPage: 20,
    messagesPerPage: 50,
  },
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
  },
};
