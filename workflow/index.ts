/**
 * Knowledge Base Workflows
 * 
 * Export workflow definitions for the KB module
 */

import ArticleReviewWorkflow from './ArticleReviewWorkflow';
import KnowledgeSyncWorkflow from './KnowledgeSyncWorkflow';

const workflows = [
  ArticleReviewWorkflow,
  KnowledgeSyncWorkflow,
];

export default workflows;
export {
  ArticleReviewWorkflow,
  KnowledgeSyncWorkflow,
};
