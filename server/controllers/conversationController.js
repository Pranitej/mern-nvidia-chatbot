import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { config } from '../config/config.js';

const createSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  model: z.string().optional(),
});

const renameSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function listConversations(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = config.pagination.conversationsPerPage;
    const skip  = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ conversations, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function createConversation(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const conversation = await Conversation.create({
      userId: req.user.id,
      title:  data.title || 'New Conversation',
      model:  data.model || config.models.default,
    });
    res.status(201).json({ conversation });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function renameConversation(req, res, next) {
  try {
    const data = renameSchema.parse(req.body);
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title: data.title },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    await Message.deleteMany({ conversationId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
