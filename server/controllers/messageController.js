import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { config } from '../config/config.js';

export async function listMessages(req, res, next) {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = config.pagination.messagesPerPage;
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: req.params.id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId: req.params.id }),
    ]);

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}
