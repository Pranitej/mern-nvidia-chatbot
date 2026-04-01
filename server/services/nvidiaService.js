import OpenAI from 'openai';
import { env } from '../config/env.js';
import { config } from '../config/config.js';
import { logger } from '../config/logger.js';

const client = new OpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: config.ai.baseURL,
});

export async function streamChat({ messages, model, onToken, onReasoning, onDone, onError }) {
  const resolvedModel = model || config.models.default;
  try {
    logger.debug({ model: resolvedModel, messageCount: messages.length }, 'nvidia:stream_start');

    const stream = await client.chat.completions.create({
      model: resolvedModel,
      messages,
      temperature: config.ai.temperature,
      top_p: config.ai.topP,
      max_tokens: config.ai.maxTokens,
      stream: true,
    });

    logger.debug({ model: resolvedModel }, 'nvidia:stream_connected');

    let fullContent   = '';
    let fullReasoning = '';
    let usage = 0;
    let chunkCount = 0;

    for await (const chunk of stream) {
      chunkCount++;
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      const reasoning = delta.reasoning_content;
      const content   = delta.content;

      if (reasoning) {
        fullReasoning += reasoning;
        onReasoning?.(reasoning);
      }

      if (content) {
        fullContent += content;
        onToken(content);
      }

      if (chunk.usage) usage = chunk.usage.completion_tokens || 0;
    }

    logger.info({ model: resolvedModel, chunkCount, tokens: usage, contentLength: fullContent.length, reasoningLength: fullReasoning.length }, 'nvidia:stream_complete');
    onDone({ content: fullContent, reasoning: fullReasoning, tokens: usage });
  } catch (err) {
    logger.error({ model: resolvedModel, err: err.message, status: err.status, code: err.code }, 'nvidia:stream_error');
    onError(err);
  }
}
