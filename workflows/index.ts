/**
 * KB Workflows
 * 
 * Export all KB workflow definitions
 */

import Reactory from '@reactorynet/reactory-core';
import ArticleReviewWorkflow from './ArticleReviewWorkflow';
import KnowledgeSyncWorkflow from './KnowledgeSyncWorkflow';
import CollectSystemDocsWorkflow from './CollectSystemDocs/CollectSystemDocsWorkflow';

const workflows: Reactory.Workflow.IWorkflow[] = [
  ArticleReviewWorkflow,
  KnowledgeSyncWorkflow,
  CollectSystemDocsWorkflow,
];

export default workflows;
