import mongoose from 'mongoose';
import { config } from '../config/config.js';

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:  { type: String, required: true, trim: true, maxlength: 100 },
  model:  { type: String, default: config.models.default },
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
