/**
 * Knowledge Base Bookmark Model
 * 
 * Manages user bookmarks for quick access to articles.
 * Allows users to save and organize their favorite content.
 */

import mongoose, { Schema, Document } from 'mongoose';

const { ObjectId } = Schema.Types;

/**
 * Bookmark interface
 */
export interface IKBBookmark {
  id?: string;
  userId: string | mongoose.Types.ObjectId;
  contentId: string | mongoose.Types.ObjectId;
  note?: string;
  tags?: string[];
  folder?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Bookmark document interface
 */
export interface IKBBookmarkDocument extends IKBBookmark, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Bookmark schema
 */
const KBBookmarkSchema = new Schema<IKBBookmarkDocument>(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentId: {
      type: ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    note: {
      type: String,
      maxlength: 500,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    folder: {
      type: String,
      trim: true,
      default: 'default',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'reactory_kb_bookmarks',
  }
);

// Indexes for efficient queries
KBBookmarkSchema.index({ userId: 1, createdAt: -1 });
KBBookmarkSchema.index({ userId: 1, folder: 1 });
KBBookmarkSchema.index({ userId: 1, tags: 1 });
KBBookmarkSchema.index({ contentId: 1 });

// Ensure unique bookmark per user per content
KBBookmarkSchema.index({ userId: 1, contentId: 1 }, { unique: true });

/**
 * Static methods
 */
KBBookmarkSchema.statics = {
  /**
   * Get user's bookmarks
   */
  async getUserBookmarks(
    userId: string,
    options: {
      folder?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<IKBBookmarkDocument[]> {
    const {
      folder,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = options;

    const query: any = { userId };

    if (folder) {
      query.folder = folder;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const sort: any = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;

    return this.find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .populate('contentId', 'title slug description contentType status createdAt')
      .exec();
  },

  /**
   * Get bookmark by user and content
   */
  async getBookmark(userId: string, contentId: string): Promise<IKBBookmarkDocument | null> {
    return this.findOne({ userId, contentId })
      .populate('contentId', 'title slug description')
      .exec();
  },

  /**
   * Check if content is bookmarked by user
   */
  async isBookmarked(userId: string, contentId: string): Promise<boolean> {
    const count = await this.countDocuments({ userId, contentId }).exec();
    return count > 0;
  },

  /**
   * Get bookmark count for content
   */
  async getContentBookmarkCount(contentId: string): Promise<number> {
    return this.countDocuments({ contentId }).exec();
  },

  /**
   * Get user's folders
   */
  async getUserFolders(userId: string): Promise<Array<{ folder: string; count: number }>> {
    return this.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$folder', count: { $sum: 1 } } },
      { $project: { folder: '$_id', count: 1, _id: 0 } },
      { $sort: { folder: 1 } },
    ]).exec();
  },

  /**
   * Get user's bookmark tags
   */
  async getUserTags(userId: string): Promise<Array<{ tag: string; count: number }>> {
    return this.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]).exec();
  },

  /**
   * Count user's bookmarks
   */
  async countUserBookmarks(userId: string, folder?: string): Promise<number> {
    const query: any = { userId };
    if (folder) {
      query.folder = folder;
    }
    return this.countDocuments(query).exec();
  },

  /**
   * Delete bookmarks for content
   */
  async deleteBookmarksForContent(contentId: string): Promise<number> {
    const result = await this.deleteMany({ contentId }).exec();
    return result.deletedCount || 0;
  },
};

/**
 * Instance methods
 */
KBBookmarkSchema.methods = {
  /**
   * Update note
   */
  async updateNote(note: string): Promise<IKBBookmarkDocument> {
    this.note = note;
    return this.save();
  },

  /**
   * Add tag
   */
  async addTag(tag: string): Promise<IKBBookmarkDocument> {
    if (!this.tags) {
      this.tags = [];
    }
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      await this.save();
    }
    return this;
  },

  /**
   * Remove tag
   */
  async removeTag(tag: string): Promise<IKBBookmarkDocument> {
    if (this.tags) {
      const normalizedTag = tag.trim().toLowerCase();
      this.tags = this.tags.filter((t) => t !== normalizedTag);
      await this.save();
    }
    return this;
  },

  /**
   * Update folder
   */
  async updateFolder(folder: string): Promise<IKBBookmarkDocument> {
    this.folder = folder.trim();
    return this.save();
  },

  /**
   * Update tags
   */
  async updateTags(tags: string[]): Promise<IKBBookmarkDocument> {
    this.tags = tags.map((t) => t.trim().toLowerCase());
    return this.save();
  },
};

/**
 * Virtual properties
 */
KBBookmarkSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
KBBookmarkSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Model
 */
const KBBookmark = mongoose.model<IKBBookmarkDocument>('KBBookmark', KBBookmarkSchema);

export default KBBookmark;

