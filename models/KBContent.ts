/**
 * Knowledge Base Content Discriminator Model
 *
 * Extends the base Content model using Mongoose discriminators, sharing the
 * `reactory_content` collection while adding KB-specific fields. Mongoose
 * automatically adds a `__t: 'KBContent'` filter to all queries on this model,
 * keeping KB documents isolated from generic Content documents.
 */

import mongoose, { Document } from 'mongoose';
import { Content } from '@reactory/server-modules/reactory-core/models';
import {
  IKBContent,
  KBContentType,
  KBVisibility,
  KBArticleStatus,
} from '../types';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Mongoose Document interface for KBContent.
 * Combines the KB-specific fields with the Mongoose Document API.
 */
export interface IKBContentDocument extends IKBContent, Document {}

/**
 * Sub-schema for a single localized content variant.
 */
const KBLocalizedContentSchema = new mongoose.Schema(
  {
    lng: { type: String, required: true },
    title: { type: String },
    content: { type: String },
    summary: { type: String },
    description: { type: String },
    published: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },
    modifiedBy: { type: ObjectId, ref: 'User' },
  },
  { _id: false }
);

/**
 * Discriminator schema – only the fields that are *additional* to the base
 * ContentSchema. Mongoose merges these with the base schema automatically.
 */
const KBContentSchema = new mongoose.Schema<IKBContentDocument>({
  // ── Content type classification ───────────────────────────────────────────
  contentType: {
    type: String,
    enum: Object.values(KBContentType),
    index: true,
  },

  // ── Multi-language support ────────────────────────────────────────────────
  lng: { type: String, default: 'en' },
  localizedContent: { type: [KBLocalizedContentSchema], default: [] },

  // ── Knowledge base relationships ──────────────────────────────────────────
  knowledgeBase: { type: ObjectId, ref: 'Content', index: true },
  categories: [{ type: ObjectId, ref: 'Content' }],
  tags: [{ type: String, trim: true, lowercase: true }],

  // ── KB metadata ───────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: Object.values(KBArticleStatus),
    default: KBArticleStatus.DRAFT,
    index: true,
  },
  visibility: {
    type: String,
    enum: Object.values(KBVisibility),
    default: KBVisibility.PRIVATE,
    index: true,
  },
  allowComments: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  lastViewed: { type: Date },

  // ── Related model references ──────────────────────────────────────────────
  attachments: [{ type: ObjectId, ref: 'KBAttachment' }],
  bookmarks: [{ type: ObjectId, ref: 'KBBookmark' }],

  // ── Hierarchical / book-style content ────────────────────────────────────
  parentContent: { type: ObjectId, ref: 'Content' },
  childContent: [{ type: ObjectId, ref: 'Content' }],
  order: { type: Number, default: 0 },
});

// ── Compound indexes for common service queries ──────────────────────────────
KBContentSchema.index({ contentType: 1, knowledgeBase: 1 });
KBContentSchema.index({ contentType: 1, status: 1 });
KBContentSchema.index({ contentType: 1, visibility: 1 });
KBContentSchema.index({ contentType: 1, createdBy: 1 });
KBContentSchema.index({ tags: 1 });

// ── Virtual `id` mirroring base model convention ────────────────────────────
KBContentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

KBContentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * KBContent discriminator model.
 *
 * Usage:
 *   import KBContent from '../models/KBContent';
 *
 *   const kb = await KBContent.findOne({ slug: 'my-kb', contentType: 'knowledge-base' });
 *   // Mongoose automatically scopes this to { __t: 'KBContent', ... }
 */
const KBContent = Content.discriminator<IKBContentDocument>('KBContent', KBContentSchema);

export default KBContent;
