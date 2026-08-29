import Reactory from '@reactorynet/reactory-core';
import logger from '@reactory/server-core/logging';
import ReactoryContextProvider from '@reactory/server-core/context/ReactoryContextProvider';
import {
  WorkflowBase,
  StepBody,
  StepExecutionContext,
  ExecutionResult,
} from '@reactorynet/workflow-es';

/**
 * Knowledge Sync Workflow
 * 
 * Synchronizes knowledge bases with external sources (Confluence, Notion, etc.).
 * Handles import, transformation, conflict resolution, and indexing.
 */

class KnowledgeSyncData {
  public kbId: string;
  public sourceType: string; // 'confluence', 'notion', 'sharepoint', etc.
  public sourceConfig: any;
  public connectionId?: string;
  public importedItems?: any[];
  public transformedItems?: any[];
  public createdArticles?: string[];
  public updatedArticles?: string[];
  public failedItems?: any[];
  public syncStats?: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
}

abstract class KnowledgeSyncStep extends StepBody {
  public context: Reactory.Server.IReactoryContext;
  public data: KnowledgeSyncData;

  /**
   * Initialize the Reactory context and services for this step.
   * If a context is already provided (e.g. by the workflow engine), it will be reused.
   */
  async initializeServices(): Promise<void> {
    if (!this.context) {
      const ctx: any = await ReactoryContextProvider(null, null);
      await ctx.forUser(process.env.KB_SYSTEM_USER || 'kb@reactory.net');
      await ctx.forPartner(process.env.KB_SYSTEM_PARTNER || 'reactory');
      this.context = ctx;
      if (!this.context.user) {
        throw new Error('Failed to initialize workflow context: user not found');
      }
    }
  }

  protected logError(message: string, error: any, step: string): void {
    this.context.error(message, { error: error.message, stack: error.stack }, step);
  }
}

/**
 * Step 1: Initialize Sync
 */
class InitializeSync extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      logger.info(`[KnowledgeSyncWorkflow] Initializing sync: KB=${this.data.kbId}, Source=${this.data.sourceType}`);

      const kbService: any = this.context.getService('kb.KnowledgeBaseService@1.0.0');
      if (!kbService) throw new Error('KnowledgeBaseService not available');

      const kb = await kbService.getKnowledgeBase(this.data.kbId);
      if (!kb) {
        throw new Error(`Knowledge base not found: ${this.data.kbId}`);
      }

      // Initialize sync stats
      this.data.syncStats = {
        total: 0,
        created: 0,
        updated: 0,
        failed: 0,
      };

      this.data.createdArticles = [];
      this.data.updatedArticles = [];
      this.data.failedItems = [];

      logger.info('[KnowledgeSyncWorkflow] Sync initialized');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error initializing sync:', error);
      throw error;
    }
  }
}

/**
 * Step 2: Connect to External Source
 */
class ConnectToSource extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Connecting to ${this.data.sourceType}`);

      // In a real implementation, this would establish connection to external source
      // using the sourceConfig (API keys, URLs, etc.)
      const connectionId = await establishConnection(this.data.sourceType, this.data.sourceConfig);
      this.data.connectionId = connectionId;

      logger.info(`[KnowledgeSyncWorkflow] Connected successfully: ${connectionId}`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error connecting to source:', error);
      throw error;
    }
  }
}

/**
 * Step 3: Import Content from Source
 */
class ImportContent extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Importing content from ${this.data.sourceType}`);

      // In a real implementation, this would fetch content from the external source
      const importedItems = await fetchContentFromSource(
        this.data.sourceType,
        this.data.connectionId!,
        this.data.sourceConfig
      );

      this.data.importedItems = importedItems;
      this.data.syncStats!.total = importedItems.length;

      logger.info(`[KnowledgeSyncWorkflow] Imported ${importedItems.length} items`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error importing content:', error);
      throw error;
    }
  }
}

/**
 * Step 4: Transform and Map Data
 */
class TransformData extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Transforming ${this.data.importedItems?.length || 0} items`);

      const transformedItems = await transformImportedData(
        this.data.importedItems || [],
        this.data.sourceType,
        this.data.kbId
      );

      this.data.transformedItems = transformedItems;

      logger.info(`[KnowledgeSyncWorkflow] Transformed ${transformedItems.length} items`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error transforming data:', error);
      throw error;
    }
  }
}

/**
 * Step 5: Validate Transformed Data
 */
class ValidateData extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Validating transformed data`);

      const validItems: any[] = [];
      const invalidItems: any[] = [];

      for (const item of this.data.transformedItems || []) {
        const validation = validateArticleData(item);
        if (validation.valid) {
          validItems.push(item);
        } else {
          invalidItems.push({ item, errors: validation.errors });
          this.data.failedItems!.push({ item, reason: validation.errors.join(', ') });
        }
      }

      this.data.transformedItems = validItems;
      this.data.syncStats!.failed = invalidItems.length;

      logger.info(`[KnowledgeSyncWorkflow] Validation complete: ${validItems.length} valid, ${invalidItems.length} invalid`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error validating data:', error);
      throw error;
    }
  }
}

/**
 * Step 6: Create/Update Articles
 */
class SyncArticles extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Syncing ${this.data.transformedItems?.length || 0} articles`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');
      if (!articleService) throw new Error('ArticleService not available');

      for (const item of this.data.transformedItems || []) {
        try {
          // Check if article already exists (by external ID or slug)
          const existingArticle = await findExistingArticle(articleService, item);

          if (existingArticle) {
            // Update existing article
            await articleService.updateArticle(existingArticle.id, item);
            this.data.updatedArticles!.push(existingArticle.id);
            this.data.syncStats!.updated++;
          } else {
            // Create new article
            const newArticle = await articleService.createArticle(item);
            this.data.createdArticles!.push(newArticle.id);
            this.data.syncStats!.created++;
          }
        } catch (error) {
          logger.error(`[KnowledgeSyncWorkflow] Error syncing article:`, error);
          this.data.failedItems!.push({ item, reason: error.message });
          this.data.syncStats!.failed++;
        }
      }

      logger.info(`[KnowledgeSyncWorkflow] Sync complete: ${this.data.syncStats!.created} created, ${this.data.syncStats!.updated} updated, ${this.data.syncStats!.failed} failed`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error syncing articles:', error);
      throw error;
    }
  }
}

/**
 * Step 7: Index New Content
 */
class IndexContent extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Indexing synced content for KB ${this.data.kbId}`);

      const searchService: any = this.context.getService('kb.SearchService@1.0.0');
      if (!searchService) {
        logger.warn('[KnowledgeSyncWorkflow] SearchService not available, skipping indexing');
        return ExecutionResult.next();
      }

      await searchService.reindexKnowledgeBase(this.data.kbId);

      logger.info('[KnowledgeSyncWorkflow] Content indexed successfully');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error indexing content:', error);
      // Don't fail the workflow if indexing fails
      return ExecutionResult.next();
    }
  }
}

/**
 * Step 8: Complete Workflow
 */
class Complete extends KnowledgeSyncStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[KnowledgeSyncWorkflow] Completing sync for KB ${this.data.kbId}`);
      logger.info(`[KnowledgeSyncWorkflow] Final stats:`, this.data.syncStats);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[KnowledgeSyncWorkflow] Error completing workflow:', error);
      throw error;
    }
  }
}

/**
 * Helper: Establish connection to external source
 */
async function establishConnection(sourceType: string, config: any): Promise<string> {
  // In a real implementation, this would authenticate with the external service
  return `conn-${sourceType}-${Date.now()}`;
}

/**
 * Helper: Fetch content from external source
 */
async function fetchContentFromSource(
  sourceType: string,
  connectionId: string,
  config: any
): Promise<any[]> {
  // In a real implementation, this would use source-specific APIs
  // to fetch pages/documents (Confluence API, Notion API, etc.)
  return [];
}

/**
 * Helper: Transform imported data to article format
 */
async function transformImportedData(
  items: any[],
  sourceType: string,
  kbId: string
): Promise<any[]> {
  // Transform based on source type
  return items.map(item => ({
    kbId,
    title: item.title || item.name,
    content: item.content || item.body,
    description: item.summary || item.excerpt,
    lng: item.language || 'en',
    tags: item.tags || [],
    categories: item.categories || [],
    metadata: {
      sourceType,
      sourceId: item.id,
      sourceUrl: item.url,
      importedAt: new Date(),
    },
  }));
}

/**
 * Helper: Validate article data
 */
function validateArticleData(item: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.title || item.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!item.content || item.content.length < 100) {
    errors.push('Content must be at least 100 characters');
  }

  if (!item.lng) {
    errors.push('Language must be specified');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper: Find existing article by external ID or slug
 */
async function findExistingArticle(articleService: any, item: any): Promise<any | null> {
  // In a real implementation, this would query for articles with matching external IDs
  try {
    if (item.metadata?.sourceId) {
      // Query by external source ID stored in metadata
      const articles = await articleService.listArticles({
        'metadata.sourceId': item.metadata.sourceId,
      });
      return articles[0] || null;
    }
  } catch (error) {
    return null;
  }
  return null;
}

/**
 * Main workflow that orchestrates the knowledge synchronization process
 */
class KnowledgeSyncWorkflowImpl implements WorkflowBase<KnowledgeSyncData> {
  id: string = 'kb.KnowledgeSyncWorkflow@1.0.0';
  version: string = '1.0.0';

  public build(builder: any) {
    builder
      .startWith(InitializeSync)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(ConnectToSource)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(ImportContent)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(TransformData)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(ValidateData)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(SyncArticles)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(IndexContent)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        })
        .output((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          data = step.data;
        })
      .then(Complete)
        .input((step: KnowledgeSyncStep, data: KnowledgeSyncData) => {
          step.data = data;
        });
  }
}

export const KnowledgeSyncWorkflow: Reactory.Workflow.IWorkflow = {
  id: 'kb.KnowledgeSyncWorkflow@1.0.0',
  nameSpace: 'kb',
  name: 'KnowledgeSyncWorkflow',
  component: KnowledgeSyncWorkflowImpl,
  category: 'workflow',
  autoStart: false,
  version: '1.0.0',
} as Reactory.Workflow.IWorkflow;

export default KnowledgeSyncWorkflow;
