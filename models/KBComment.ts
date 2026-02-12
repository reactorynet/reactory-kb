/**
 * Knowledge Base Comment Model
 * 
 * Manages comments on KB articles.
 * Supports threaded discussions with replies.
 */

import mongoose, { Schema, Document } from 'mongoose';

const { ObjectId } = Schema.Types;

/**
 * Comment interface
 */
export interface IKBComment {
  id?: string;
  contentId: string | mongoose.Types.ObjectId;
  author: string | mongoose.Types.ObjectId;
  content: string;
  parent?: string | mongoose.Types.ObjectId; // Parent comment for threading
  replies?: string[] | mongoose.Types.ObjectId[]; // Child comments
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string | mongoose.Types.ObjectId;
  edited?: boolean;
  editedAt?: Date;
  likes?: number;
  likedBy?: string[] | mongoose.Types.ObjectId[];
  metadata?: Record<string, any>;
}

/**
 * Comment document interface
 */
export interface IKBCommentDocument extends IKBComment, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Comment schema
 */
const KBCommentSchema = new Schema<IKBCommentDocument>(
  {
    contentId: {
      type: ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    author: {
      type: ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    parent: {
      type: ObjectId,
      ref: 'KBComment',
      default: null,
      index: true,
    },
    replies: [{
      type: ObjectId,
      ref: 'KBComment',
    }],
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: ObjectId,
      ref: 'User',
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: ObjectId,
      ref: 'User',
    }],
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'reactory_kb_comments',
  }
);

// Indexes for efficient queries
KBCommentSchema.index({ contentId: 1, createdAt: -1 });
KBCommentSchema.index({ contentId: 1, parent: 1 });
KBCommentSchema.index({ author: 1, createdAt: -1 });
KBCommentSchema.index({ contentId: 1, deleted: 1 });

/**
 * Static methods
 */
KBCommentSchema.statics = {
  /**
   * Get comments for content (top-level only)
   */
  async getCommentsForContent(
    contentId: string,
    includeDeleted: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<IKBCommentDocument[]> {
    const query: any = { contentId, parent: null };
    if (!includeDeleted) {
      query.deleted = false;
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('author', 'firstName lastName email avatar')
      .populate({
        path: 'replies',
        match: includeDeleted ? {} : { deleted: false },
        populate: {
          path: 'author',
          select: 'firstName lastName email avatar',
        },
      })
      .exec();
  },

  /**
   * Get replies for a comment
   */
  async getReplies(commentId: string, includeDeleted: boolean = false): Promise<IKBCommentDocument[]> {
    const query: any = { parent: commentId };
    if (!includeDeleted) {
      query.deleted = false;
    }

    return this.find(query)
      .sort({ createdAt: 1 })
      .populate('author', 'firstName lastName email avatar')
      .exec();
  },

  /**
   * Get comment thread (comment and all its descendants)
   */
  async getThread(commentId: string, includeDeleted: boolean = false): Promise<IKBCommentDocument[]> {
    const comment = await this.findById(commentId)
      .populate('author', 'firstName lastName email avatar')
      .exec();

    if (!comment) return [];

    const replies = await this.getReplies(commentId, includeDeleted);
    const thread = [comment];

    for (const reply of replies) {
      const subReplies = await this.getThread(reply._id.toString(), includeDeleted);
      thread.push(...subReplies);
    }

    return thread;
  },

  /**
   * Count comments for content
   */
  async countCommentsForContent(contentId: string, includeDeleted: boolean = false): Promise<number> {
    const query: any = { contentId };
    if (!includeDeleted) {
      query.deleted = false;
    }
    return this.countDocuments(query).exec();
  },

  /**
   * Get user's comments
   */
  async getUserComments(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IKBCommentDocument[]> {
    return this.find({ author: userId, deleted: false })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('contentId', 'title slug')
      .exec();
  },
};

/**
 * Instance methods
 */
KBCommentSchema.methods = {
  /**
   * Soft delete comment
   */
  async softDelete(deletedBy: string): Promise<IKBCommentDocument> {
    this.deleted = true;
    this.deletedAt = new Date();
    this.deletedBy = new mongoose.Types.ObjectId(deletedBy);
    return this.save();
  },

  /**
   * Add reply
   */
  async addReply(replyId: string): Promise<IKBCommentDocument> {
    if (!this.replies) {
      this.replies = [];
    }
    this.replies.push(new mongoose.Types.ObjectId(replyId));
    return this.save();
  },

  /**
   * Remove reply
   */
  async removeReply(replyId: string): Promise<IKBCommentDocument> {
    if (this.replies) {
      this.replies = this.replies.filter(
        (id) => id.toString() !== replyId
      );
    }
    return this.save();
  },

  /**
   * Toggle like
   */
  async toggleLike(userId: string): Promise<{ liked: boolean; count: number }> {
    if (!this.likedBy) {
      this.likedBy = [];
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const index = this.likedBy.findIndex((id) => id.toString() === userId);

    if (index > -1) {
      // Unlike
      this.likedBy.splice(index, 1);
      this.likes = Math.max(0, (this.likes || 0) - 1);
      await this.save();
      return { liked: false, count: this.likes };
    } else {
      // Like
      this.likedBy.push(userObjectId);
      this.likes = (this.likes || 0) + 1;
      await this.save();
      return { liked: true, count: this.likes };
    }
  },

  /**
   * Mark as edited
   */
  async markAsEdited(): Promise<IKBCommentDocument> {
    this.edited = true;
    this.editedAt = new Date();
    return this.save();
  },
};

/**
 * Virtual properties
 */
KBCommentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

KBCommentSchema.virtual('replyCount').get(function () {
  return this.replies ? this.replies.length : 0;
});

// Ensure virtuals are included in JSON
KBCommentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Middleware
 */
// Update parent's replies array when a reply is created
KBCommentSchema.pre('save', async function (next) {
  if (this.isNew && this.parent) {
    const parentComment = await mongoose.model('KBComment').findById(this.parent);
    if (parentComment) {
      await parentComment.addReply(this._id.toString());
    }
  }
  next();
});

/**
 * Model
 */
const KBComment = mongoose.model<IKBCommentDocument>('KBComment', KBCommentSchema);

export default KBComment;

