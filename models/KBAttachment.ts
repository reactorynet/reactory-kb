/**
 * Knowledge Base Attachment Model
 * 
 * Manages file attachments for KB articles.
 * Links to ReactoryFileModel for actual file storage.
 */

import mongoose, { Schema, Document } from 'mongoose';

const { ObjectId } = Schema.Types;

/**
 * Attachment interface
 */
export interface IKBAttachment {
  id?: string;
  contentId: string | mongoose.Types.ObjectId;
  fileId: string | mongoose.Types.ObjectId; // Reference to ReactoryFileModel
  filename: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string | mongoose.Types.ObjectId;
  uploadedAt: Date;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
}

/**
 * Attachment document interface
 */
export interface IKBAttachmentDocument extends IKBAttachment, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Attachment schema
 */
const KBAttachmentSchema = new Schema<IKBAttachmentDocument>(
  {
    contentId: {
      type: ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    fileId: {
      type: ObjectId,
      ref: 'ReactoryFile',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    order: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false, // We manage uploadedAt manually
    collection: 'reactory_kb_attachments',
  }
);

// Indexes for efficient queries
KBAttachmentSchema.index({ contentId: 1, order: 1 });
KBAttachmentSchema.index({ contentId: 1, uploadedAt: -1 });
KBAttachmentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
KBAttachmentSchema.index({ mimetype: 1 });

/**
 * Static methods
 */
KBAttachmentSchema.statics = {
  /**
   * Get attachments for content
   */
  async getAttachmentsForContent(
    contentId: string,
    options: {
      sortBy?: 'order' | 'uploadedAt' | 'filename';
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<IKBAttachmentDocument[]> {
    const { sortBy = 'order', sortDirection = 'asc' } = options;

    const sort: any = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;

    return this.find({ contentId })
      .sort(sort)
      .populate('uploadedBy', 'firstName lastName email avatar')
      .populate('fileId')
      .exec();
  },

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<IKBAttachmentDocument | null> {
    return this.findById(attachmentId)
      .populate('uploadedBy', 'firstName lastName email avatar')
      .populate('fileId')
      .populate('contentId', 'title slug')
      .exec();
  },

  /**
   * Count attachments for content
   */
  async countAttachmentsForContent(contentId: string): Promise<number> {
    return this.countDocuments({ contentId }).exec();
  },

  /**
   * Get total size of attachments for content
   */
  async getTotalSizeForContent(contentId: string): Promise<number> {
    const result = await this.aggregate([
      { $match: { contentId: new mongoose.Types.ObjectId(contentId) } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]).exec();

    return result.length > 0 ? result[0].totalSize : 0;
  },

  /**
   * Get attachments by type
   */
  async getAttachmentsByType(
    contentId: string,
    mimetypes: string[]
  ): Promise<IKBAttachmentDocument[]> {
    return this.find({ contentId, mimetype: { $in: mimetypes } })
      .sort({ order: 1 })
      .populate('uploadedBy', 'firstName lastName email avatar')
      .exec();
  },

  /**
   * Get images for content
   */
  async getImages(contentId: string): Promise<IKBAttachmentDocument[]> {
    return this.getAttachmentsByType(contentId, [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
    ]);
  },

  /**
   * Get documents for content
   */
  async getDocuments(contentId: string): Promise<IKBAttachmentDocument[]> {
    return this.getAttachmentsByType(contentId, [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
    ]);
  },

  /**
   * Reorder attachments
   */
  async reorderAttachments(
    contentId: string,
    attachmentOrders: Array<{ id: string; order: number }>
  ): Promise<void> {
    const bulkOps = attachmentOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id), contentId },
        update: { $set: { order } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.bulkWrite(bulkOps);
    }
  },

  /**
   * Delete attachments for content
   */
  async deleteAttachmentsForContent(contentId: string): Promise<number> {
    const result = await this.deleteMany({ contentId }).exec();
    return result.deletedCount || 0;
  },
};

/**
 * Instance methods
 */
KBAttachmentSchema.methods = {
  /**
   * Update description
   */
  async updateDescription(description: string): Promise<IKBAttachmentDocument> {
    this.description = description;
    return this.save();
  },

  /**
   * Update order
   */
  async updateOrder(order: number): Promise<IKBAttachmentDocument> {
    this.order = order;
    return this.save();
  },

  /**
   * Check if attachment is an image
   */
  isImage(): boolean {
    return this.mimetype.startsWith('image/');
  },

  /**
   * Check if attachment is a document
   */
  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
    ];
    return documentTypes.includes(this.mimetype);
  },

  /**
   * Check if attachment is a video
   */
  isVideo(): boolean {
    return this.mimetype.startsWith('video/');
  },

  /**
   * Check if attachment is audio
   */
  isAudio(): boolean {
    return this.mimetype.startsWith('audio/');
  },

  /**
   * Get file extension
   */
  getExtension(): string {
    const parts = this.filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  },

  /**
   * Get human-readable file size
   */
  getFormattedSize(): string {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
};

/**
 * Virtual properties
 */
KBAttachmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

KBAttachmentSchema.virtual('extension').get(function () {
  return this.getExtension();
});

KBAttachmentSchema.virtual('formattedSize').get(function () {
  return this.getFormattedSize();
});

// Ensure virtuals are included in JSON
KBAttachmentSchema.set('toJSON', {
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
const KBAttachment = mongoose.model<IKBAttachmentDocument>('KBAttachment', KBAttachmentSchema);

export default KBAttachment;

