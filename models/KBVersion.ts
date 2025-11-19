/**
 * Knowledge Base Version Model
 * 
 * Tracks version history for articles and content.
 * Enables version control and rollback functionality.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IArticleVersion } from '../types';

const { ObjectId } = Schema.Types;

/**
 * Version document interface
 */
export interface IKBVersionDocument extends IArticleVersion, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Version schema
 */
const KBVersionSchema = new Schema<IKBVersionDocument>(
  {
    articleId: {
      type: ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    description: {
      type: String,
    },
    changeSummary: {
      type: String,
    },
    author: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false, // We manage createdAt manually
    collection: 'reactory_kb_versions',
  }
);

// Indexes for efficient queries
KBVersionSchema.index({ articleId: 1, versionNumber: -1 });
KBVersionSchema.index({ articleId: 1, createdAt: -1 });
KBVersionSchema.index({ author: 1, createdAt: -1 });

// Ensure version number is unique per article
KBVersionSchema.index({ articleId: 1, versionNumber: 1 }, { unique: true });

/**
 * Static methods
 */
KBVersionSchema.statics = {
  /**
   * Get latest version for an article
   */
  async getLatestVersion(articleId: string): Promise<IKBVersionDocument | null> {
    return this.findOne({ articleId })
      .sort({ versionNumber: -1 })
      .populate('author', 'firstName lastName email avatar')
      .exec();
  },

  /**
   * Get version history for an article
   */
  async getVersionHistory(
    articleId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<IKBVersionDocument[]> {
    return this.find({ articleId })
      .sort({ versionNumber: -1 })
      .skip(offset)
      .limit(limit)
      .populate('author', 'firstName lastName email avatar')
      .exec();
  },

  /**
   * Get specific version
   */
  async getVersion(articleId: string, versionNumber: number): Promise<IKBVersionDocument | null> {
    return this.findOne({ articleId, versionNumber })
      .populate('author', 'firstName lastName email avatar')
      .exec();
  },

  /**
   * Count versions for an article
   */
  async countVersions(articleId: string): Promise<number> {
    return this.countDocuments({ articleId }).exec();
  },

  /**
   * Delete old versions (keep only the latest N versions)
   */
  async pruneOldVersions(articleId: string, keepCount: number = 50): Promise<number> {
    const versions = await this.find({ articleId })
      .sort({ versionNumber: -1 })
      .skip(keepCount)
      .select('_id')
      .exec();

    if (versions.length === 0) return 0;

    const versionIds = versions.map(v => v._id);
    const result = await this.deleteMany({ _id: { $in: versionIds } }).exec();
    return result.deletedCount || 0;
  },
};

/**
 * Instance methods
 */
KBVersionSchema.methods = {
  /**
   * Get next version number
   */
  async getNextVersionNumber(): Promise<number> {
    const latestVersion = await (this.constructor as any).getLatestVersion(this.articleId);
    return latestVersion ? latestVersion.versionNumber + 1 : 1;
  },

  /**
   * Compare with another version
   */
  async compareWith(otherVersionNumber: number): Promise<any> {
    const otherVersion = await (this.constructor as any).getVersion(
      this.articleId,
      otherVersionNumber
    );

    if (!otherVersion) {
      throw new Error(`Version ${otherVersionNumber} not found`);
    }

    return {
      versionA: {
        number: this.versionNumber,
        title: this.title,
        content: this.content,
        createdAt: this.createdAt,
      },
      versionB: {
        number: otherVersion.versionNumber,
        title: otherVersion.title,
        content: otherVersion.content,
        createdAt: otherVersion.createdAt,
      },
      differences: [
        {
          field: 'title',
          oldValue: otherVersion.title,
          newValue: this.title,
          type: this.title !== otherVersion.title ? 'modified' : 'unchanged',
        },
        {
          field: 'content',
          oldValue: otherVersion.content,
          newValue: this.content,
          type: this.content !== otherVersion.content ? 'modified' : 'unchanged',
        },
      ],
    };
  },
};

/**
 * Virtual properties
 */
KBVersionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
KBVersionSchema.set('toJSON', {
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
const KBVersion = mongoose.model<IKBVersionDocument>('KBVersion', KBVersionSchema);

export default KBVersion;

