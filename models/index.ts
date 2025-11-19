/**
 * Knowledge Base Models Index
 * 
 * Central export point for all KB models
 */

import KBVersion from './KBVersion';
import KBComment from './KBComment';
import KBBookmark from './KBBookmark';
import KBAttachment from './KBAttachment';

// Export models
export {
  KBVersion,
  KBComment,
  KBBookmark,
  KBAttachment,
};

// Export document interfaces
export type { IKBVersionDocument } from './KBVersion';
export type { IKBCommentDocument } from './KBComment';
export type { IKBBookmarkDocument } from './KBBookmark';
export type { IKBAttachmentDocument } from './KBAttachment';

// Export for module registration
export default [
  KBVersion,
  KBComment,
  KBBookmark,
  KBAttachment,
];
