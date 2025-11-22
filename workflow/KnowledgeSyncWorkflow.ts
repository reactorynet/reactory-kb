/**
 * Knowledge Sync Workflow
 * 
 * Synchronizes knowledge bases with external sources
 */

import Reactory from '@reactory/reactory-core';

const KnowledgeSyncWorkflow: Reactory.Workflow.IReactoryWorkflowConfig = {
  id: 'kb.KnowledgeSyncWorkflow@1.0.0',
  name: 'KnowledgeSyncWorkflow',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Knowledge Base Synchronization',
  description: 'Workflow for synchronizing knowledge bases with external sources',
  
  /**
   * Workflow states
   */
  states: {
    idle: {
      id: 'idle',
      name: 'Idle',
      description: 'No sync in progress',
      isInitial: true,
      transitions: ['start_sync'],
    },
    connecting: {
      id: 'connecting',
      name: 'Connecting',
      description: 'Connecting to external source',
      transitions: ['connected', 'connection_failed'],
    },
    connected: {
      id: 'connected',
      name: 'Connected',
      description: 'Connected to external source',
      transitions: ['import_content', 'disconnect'],
    },
    importing: {
      id: 'importing',
      name: 'Importing',
      description: 'Importing content from source',
      transitions: ['transform', 'import_failed'],
    },
    transforming: {
      id: 'transforming',
      name: 'Transforming',
      description: 'Transforming and mapping data',
      transitions: ['creating_articles', 'transform_failed'],
    },
    creating_articles: {
      id: 'creating_articles',
      name: 'Creating Articles',
      description: 'Creating or updating articles',
      transitions: ['indexing', 'creation_failed'],
    },
    indexing: {
      id: 'indexing',
      name: 'Indexing',
      description: 'Indexing new content for search',
      transitions: ['completed', 'indexing_failed'],
    },
    completed: {
      id: 'completed',
      name: 'Completed',
      description: 'Sync completed successfully',
      isFinal: true,
      transitions: ['schedule_next'],
    },
    failed: {
      id: 'failed',
      name: 'Failed',
      description: 'Sync failed',
      transitions: ['retry', 'cancel'],
    },
  },

  /**
   * Workflow transitions
   */
  transitions: {
    start_sync: {
      id: 'start_sync',
      name: 'Start Sync',
      from: 'idle',
      to: 'connecting',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        context.log(`Starting sync for KB ${params.kbId} from source ${params.sourceType}`, 'info');
        
        // TODO: Implement actual connection logic
        return { success: true, connectionId: `conn-${Date.now()}` };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    connected: {
      id: 'connected',
      name: 'Connected',
      from: 'connecting',
      to: 'connected',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        context.log(`Connected to external source`, 'info');
        return { success: true };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    import_content: {
      id: 'import_content',
      name: 'Import Content',
      from: 'connected',
      to: 'importing',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        // TODO: Implement content import
        context.log(`Importing content from external source`, 'info');
        return { success: true, itemsImported: 0 };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    transform: {
      id: 'transform',
      name: 'Transform Data',
      from: 'importing',
      to: 'transforming',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        // TODO: Implement data transformation
        context.log(`Transforming imported data`, 'info');
        return { success: true, itemsTransformed: 0 };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    creating_articles: {
      id: 'creating_articles',
      name: 'Create/Update Articles',
      from: 'transforming',
      to: 'creating_articles',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const articleService = context.services.kb?.ArticleService;
        if (!articleService) throw new Error('ArticleService not available');

        // TODO: Implement batch article creation
        context.log(`Creating/updating articles`, 'info');
        return { success: true, articlesCreated: 0, articlesUpdated: 0 };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    indexing: {
      id: 'indexing',
      name: 'Index Content',
      from: 'creating_articles',
      to: 'indexing',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        const searchService = context.services.kb?.SearchService;
        if (!searchService) throw new Error('SearchService not available');

        await searchService.reindexKnowledgeBase(params.kbId);
        return { success: true };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    completed: {
      id: 'completed',
      name: 'Complete',
      from: 'indexing',
      to: 'completed',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        context.log(`Sync completed successfully for KB ${params.kbId}`, 'info');
        return { success: true, completedAt: new Date() };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
    retry: {
      id: 'retry',
      name: 'Retry',
      from: 'failed',
      to: 'idle',
      handler: async (context: Reactory.Server.IReactoryContext, params: any) => {
        context.log(`Retrying sync for KB ${params.kbId}`, 'info');
        return { success: true };
      },
      roles: ['ADMIN', 'SYNC_MANAGER'],
    },
  },

  /**
   * Workflow permissions
   */
  roles: ['ADMIN', 'SYNC_MANAGER'],
  
  /**
   * Workflow metadata
   */
  metadata: {
    category: 'synchronization',
    tags: ['sync', 'import', 'integration'],
    supportsScheduling: true,
  },
};

export default KnowledgeSyncWorkflow;

