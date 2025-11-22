/**
 * Article Review Workflow
 * 
 * Manages the review and approval process for knowledge base articles
 */

import Reactory from '@reactory/reactory-core';
import { KBArticleStatus } from '../types';

const ArticleReviewWorkflow: Reactory.Workflow.IReactoryWorkflowConfig = {
  id: 'kb.ArticleReviewWorkflow@1.0.0',
  name: 'ArticleReviewWorkflow',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Article Review and Approval',
  description: 'Workflow for reviewing and approving knowledge base articles',
  
  /**
   * Workflow states
   */
  states: {
    draft: {
      id: 'draft',
      name: 'Draft',
      description: 'Article is in draft state',
      isInitial: true,
      transitions: ['submit_for_review', 'publish_directly'],
    },
    under_review: {
      id: 'under_review',
      name: 'Under Review',
      description: 'Article is being reviewed',
      transitions: ['approve', 'request_changes', 'reject'],
    },
    revision_requested: {
      id: 'revision_requested',
      name: 'Revision Requested',
      description: 'Changes have been requested',
      transitions: ['resubmit', 'cancel'],
    },
    approved: {
      id: 'approved',
      name: 'Approved',
      description: 'Article has been approved',
      transitions: ['publish'],
    },
    published: {
      id: 'published',
      name: 'Published',
      description: 'Article is published',
      isFinal: true,
      transitions: ['archive', 'unpublish'],
    },
    archived: {
      id: 'archived',
      name: 'Archived',
      description: 'Article is archived',
      transitions: ['restore'],
    },
    rejected: {
      id: 'rejected',
      name: 'Rejected',
      description: 'Article was rejected',
      isFinal: true,
    },
  },

  /**
   * Workflow transitions
   */
  transitions: {
    submit_for_review: {
      id: 'submit_for_review',
      name: 'Submit for Review',
      from: 'draft',
      to: 'under_review',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        // Update article status
        const article = await articleService.updateArticle(params.articleId, {
          status: KBArticleStatus.UNDER_REVIEW,
        });

        // Notify reviewers
        // TODO: Implement notification system
        context.log(`Article ${params.articleId} submitted for review`, 'info');

        return { success: true, article };
      },
      roles: ['USER', 'CONTRIBUTOR'],
    },
    publish_directly: {
      id: 'publish_directly',
      name: 'Publish Directly',
      from: 'draft',
      to: 'published',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        const article = await articleService.publishArticle(params.articleId);
        return { success: true, article };
      },
      roles: ['ADMIN', 'OWNER'],
    },
    approve: {
      id: 'approve',
      name: 'Approve',
      from: 'under_review',
      to: 'approved',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        const article = await articleService.updateArticle(params.articleId, {
          status: 'approved',
        });

        context.log(`Article ${params.articleId} approved by ${context.user.email}`, 'info');
        return { success: true, article };
      },
      roles: ['REVIEWER', 'ADMIN'],
    },
    request_changes: {
      id: 'request_changes',
      name: 'Request Changes',
      from: 'under_review',
      to: 'revision_requested',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const collabService = context.services.kb?.CollaborationService;
        if (!collabService) throw new Error('CollaborationService not available');

        // Add review comment
        await collabService.addComment(params.articleId, params.feedback);

        context.log(`Changes requested for article ${params.articleId}`, 'info');
        return { success: true };
      },
      roles: ['REVIEWER', 'ADMIN'],
    },
    reject: {
      id: 'reject',
      name: 'Reject',
      from: 'under_review',
      to: 'rejected',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const collabService = context.services.kb?.CollaborationService;
        if (!collabService) throw new Error('CollaborationService not available');

        await collabService.addComment(params.articleId, `Rejected: ${params.reason}`);

        context.log(`Article ${params.articleId} rejected`, 'info');
        return { success: true };
      },
      roles: ['REVIEWER', 'ADMIN'],
    },
    resubmit: {
      id: 'resubmit',
      name: 'Resubmit',
      from: 'revision_requested',
      to: 'under_review',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        context.log(`Article ${params.articleId} resubmitted for review`, 'info');
        return { success: true };
      },
      roles: ['USER', 'CONTRIBUTOR'],
    },
    publish: {
      id: 'publish',
      name: 'Publish',
      from: 'approved',
      to: 'published',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        const article = await articleService.publishArticle(params.articleId);
        return { success: true, article };
      },
      roles: ['ADMIN', 'OWNER'],
    },
    archive: {
      id: 'archive',
      name: 'Archive',
      from: 'published',
      to: 'archived',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        const article = await articleService.archiveArticle(params.articleId);
        return { success: true, article };
      },
      roles: ['ADMIN', 'OWNER'],
    },
    restore: {
      id: 'restore',
      name: 'Restore',
      from: 'archived',
      to: 'published',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        const article = await articleService.publishArticle(params.articleId);
        return { success: true, article };
      },
      roles: ['ADMIN', 'OWNER'],
    },
  },

  /**
   * Workflow permissions
   */
  roles: ['USER', 'CONTRIBUTOR', 'REVIEWER', 'ADMIN', 'OWNER'],
  
  /**
   * Workflow metadata
   */
  metadata: {
    category: 'content-management',
    tags: ['review', 'approval', 'publishing'],
  },
};

export default ArticleReviewWorkflow;

