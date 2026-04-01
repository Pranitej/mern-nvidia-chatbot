import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { streamChat } from '../services/nvidiaService.js';
import { config } from '../config/config.js';
import { logger } from '../config/logger.js';

const validModelIds = new Set(config.models.available.map(m => m.id));

const streamSchema = z.object({
  content: z.string().min(1).max(config.chat?.maxMessageLength ?? 4000),
  model:   z.string().optional(),
});

export async function streamMessage(req, res, next) {
  const convId = req.params.conversationId;
  try {
    const { content, model: requestModel } = streamSchema.parse(req.body);
    logger.info({ convId, contentLength: content.length }, 'stream:request');

    const conversation = await Conversation.findOne({
      _id: convId,
      userId: req.user.id,
    });
    if (!conversation) {
      logger.warn({ convId, userId: req.user.id }, 'stream:conversation_not_found');
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    await Message.create({ conversationId: conversation._id, role: 'user', content });

    // Auto-title from first message
    if (conversation.title === 'New Conversation') {
      const title = content.slice(0, 60);
      await Conversation.findByIdAndUpdate(conversation._id, { title });
    }
    await Conversation.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

    // Fetch last 20 messages for context
    const history = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const messages = history.reverse().map(m => ({ role: m.role, content: m.content }));
    const modelId = (requestModel && validModelIds.has(requestModel))
      ? requestModel
      : conversation.model;
    logger.debug({ convId, model: modelId, historyLength: messages.length }, 'stream:calling_nvidia');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Track client disconnect
    let aborted = false;
    req.on('close', () => {
      aborted = true;
      clearTimeout(timeout);
      logger.info({ convId }, 'stream:client_aborted');
    });

    // Idle timeout — resets on every chunk so long responses aren't killed
    let timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logger.error({ convId }, 'stream:timeout');
        send({ type: 'error', message: 'Stream timeout' });
        res.end();
      }, config.ai.streamTimeout);
    };
    resetTimeout();

    await streamChat({
      messages,
      model: modelId,
      onToken: (token) => {
        if (aborted) return;
        resetTimeout();
        send({ type: 'token', content: token });
      },
      onReasoning: (chunk) => {
        if (aborted) return;
        resetTimeout();
        send({ type: 'reasoning', content: chunk });
      },
      onDone: async ({ content: fullContent, reasoning, tokens }) => {
        clearTimeout(timeout);
        if (aborted) {
          logger.info({ convId }, 'stream:aborted_before_save');
          res.end();
          return;
        }
        logger.info({ convId, tokens, hasReasoning: !!reasoning, contentLength: fullContent.length }, 'stream:done');
        const msg = await Message.create({
          conversationId: conversation._id,
          role: 'assistant',
          content: fullContent,
          reasoning,
          tokens,
        });
        send({ type: 'done', messageId: msg._id, tokens, model: modelId });
        res.end();
      },
      onError: (err) => {
        clearTimeout(timeout);
        if (aborted) return;
        logger.error({ convId, err: err.message, status: err.status }, 'stream:error');
        send({ type: 'error', message: err.message || 'Stream error' });
        res.end();
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    logger.error({ convId, err: err.message }, 'stream:unexpected_error');
    next(err);
  }
}
