import Reactory from '@reactorynet/reactory-core';
import logger from '@reactory/server-core/logging';
import { InstanceResourceManager } from '@reactory/server-modules/reactory-core/workflow/InstanceResourceManager';
import {
  WorkflowBase,
  StepBody,
  StepExecutionContext,
  ExecutionResult,
  WorkflowBuilder,
  StepBuilder,
} from '@reactorynet/workflow-es';
import * as globModule from 'glob';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'node:util';
import ReactoryContextProvider from '@reactory/server-core/context/ReactoryContextProvider';

const glob = promisify(globModule.glob || globModule);
import type { IKnowledgeBaseService } from '../../services/KnowledgeBaseService';
import type { IArticleService } from '../../services/ArticleService';
import { KBArticleStatus, KBContentType } from '../../types';

/**
 * Workflow Data Structure
 */
class CollectSystemDocsData {
  // Input parameters
  public forceFullScan?: boolean = false;
  public targetPaths?: string[];
  public dryRun?: boolean = false;
  public excludePatterns?: string[] = [];
  public includeDrafts?: boolean = false;
  public preserveOrphans?: boolean = false;
  public username?: string;

  // Runtime state
  public instanceId?: string;
  public kbId?: string;
  public workflowStartTime?: Date;
  public discoveredFiles?: FileMetadata[] = [];
  public fileManifest?: FileWithHash[] = [];
  public existingArticles?: Record<string, any> = {};
  public newFiles?: FileWithHash[] = [];
  public updatedFiles?: FileWithHash[] = [];
  public unchangedFiles?: FileWithHash[] = [];
  public orphanedArticles?: any[] = [];
  
  // Processing results
  public successfulArticles?: ArticleResult[] = [];
  public failedFiles?: FailedFile[] = [];
  public archivedArticles?: string[] = [];
  
  // Statistics
  public stats?: WorkflowStats;
  public errorCount: number = 0;
  public warningCount: number = 0;
  public infoCount: number = 0;
}

interface FileMetadata {
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  moduleId?: string;
  category: string;
}

interface FileWithHash extends FileMetadata {
  hash: string;
  content?: string;
}

interface ArticleResult {
  articleId: string;
  filePath: string;
  action: 'created' | 'updated';
  processingTime: number;
}

interface FailedFile {
  filePath: string;
  error: string;
  step: string;
}

interface WorkflowStats {
  discovery: {
    filesScanned: number;
    filesFound: number;
    scanPaths: string[];
    errors: number;
  };
  processing: {
    newArticles: number;
    updatedArticles: number;
    unchangedFiles: number;
    failedFiles: number;
    totalProcessed: number;
  };
  cleanup: {
    orphanedArticles: number;
    archivedArticles: number;
  };
  performance: {
    avgProcessingTime: number;
    totalDuration: number;
    peakMemoryUsage: number;
  };
}

/**
 * Base step class with shared context
 */
abstract class CollectSystemDocsStep extends StepBody {
  public context: Reactory.Server.IReactoryContext;
  public data: CollectSystemDocsData;
  
  protected kbService: IKnowledgeBaseService;
  protected articleService: IArticleService;

  /** Returns the InstanceResourceManager for this workflow run, if initialised. */
  protected get resourceManager(): InstanceResourceManager | null {
    if (!this.data?.instanceId) return null;
    return InstanceResourceManager.forInstance(this.data.instanceId);
  }
  
  async initializeServices(): Promise<void> {
    const {
      username = process.env.KB_SYSTEM_USER || 'kb@reactory.net',
    } = this.data;
    // establish a context for the workflow if we don't have one already (should be provided by the workflow engine, but just in case)
    if (!this.context) {
      const ctx: any = await ReactoryContextProvider(null);
      // Set up default user for system workflows
      await ctx.forUser(username);
      await ctx.forPartner(process.env.KB_SYSTEM_PARTNER || 'reactory');
      // validate thhe context and ensure we have a user and partner correctly set      
      this.context = ctx;
      if (!this.context.user) {
        throw new Error(`Failed to initialize workflow context: user not found`);
      }
    }
    
    this.kbService = this.context.getService<IKnowledgeBaseService>('kb.KnowledgeBaseService@1.0.0');
    this.articleService = this.context.getService<IArticleService>('kb.ArticleService@1.0.0');
  }
  
  protected logError(message: string, error: any, step: string): void {
    const meta = { error: error.message, stack: error.stack };
    this.context.error(message, meta, step);
    this.resourceManager?.error(message, { step, ...meta });
    this.data.errorCount = (this.data.errorCount ?? 0) + 1;
  }
  
  protected logWarning(message: string, context: any, step: string): void {
    this.context.warn(message, context, step);
    this.resourceManager?.warn(message, { step, ...context });
    this.data.warningCount = (this.data.warningCount ?? 0) + 1;
  }

  protected logInfo(message: string, meta?: Record<string, unknown>): void {
    logger.info(`[CollectSystemDocs] ${message}`, meta);
    this.resourceManager?.info(message, meta);
    this.data.infoCount = (this.data.infoCount ?? 0) + 1;
  }
}

/**
 * Step 1: Initialize Knowledge Base Context
 */
class InitializeKBContext extends CollectSystemDocsStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      this.data.workflowStartTime = new Date();
      this.data.errorCount = 0;
      this.data.warningCount = 0;
      this.data.infoCount = 0;
      this.data.successfulArticles = [];
      this.data.failedFiles = [];

      // Capture the workflow instance ID and initialise the resource manager
      // so all subsequent steps can write to a dedicated per-instance log file.
      const instanceId = stepContext.workflow.id;
      this.data.instanceId = instanceId;
      const rm = new InstanceResourceManager(
        'kb',
        'CollectSystemDocsWorkflow',
        '1.0.0',
        instanceId,
      );
      InstanceResourceManager.register(instanceId, rm);

      logger.info('[CollectSystemDocs] Initializing workflow context');
      rm.info('Workflow instance started', { instanceId });
      
      // Find or create "System Documentation" KB
      const kbName = process.env.KB_SYSTEM_DOCS_NAME || 'System Documentation';
      const kbSlug = 'system-documentation';
      
      let kb;
      try { 
        kb = await this.kbService.getKnowledgeBaseBySlug(kbSlug);
      }
      catch (notFoundError) { 
        logger.warn(`[CollectSystemDocs] KB "${kbName}" not found, will create a new one`, { slug: kbSlug });
        this.resourceManager?.warn(`KB "${kbName}" not found, will create a new one`, { slug: kbSlug });
        this.data.warningCount = (this.data.warningCount ?? 0) + 1;        
      }
      
      if (!kb && (process.env.KB_SYSTEM_DOCS_AUTO_CREATE !== 'false')) {
        this.logInfo('Creating System Documentation KB');
        kb = await this.kbService.createKnowledgeBase({
          slug: kbSlug,
          title: kbName,
          description: 'Automatically generated documentation from README files across the Reactory platform',
          visibility: 'public' as any,
          lng: 'en',
          tags: ['system', 'auto-generated', 'documentation'],
          categories: [],
        });
      }
      
      if (!kb) {
        throw new Error('System Documentation knowledge base not found and auto-create is disabled');
      }
      
      this.data.kbId = kb._id.toHexString() as string;

      const initMeta = { kbId: this.data.kbId, kbName: kb.title };
      this.logInfo('KB Context initialized', initMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Failed to initialize KB context', error, 'InitializeKBContext');
      throw error;
    }
  }
}

/**
 * Step 2: Discover README Files
 */
class DiscoverREADMEFiles extends CollectSystemDocsStep {
  /**
   * Single recursive pattern to discover all README/readme files.
   * Using a single glob with ** is more reliable than multiple specific paths
   * and automatically picks up new directories without needing pattern updates.
   */
  private readonly DEFAULT_SCAN_PATTERNS = [
    '**/README.md',
    '**/readme.md',
  ];

  private readonly DEFAULT_EXCLUDE = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
  ];
  
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      const baseDir = process.env.REACTORY_SERVER || process.cwd();
      const scanPatterns = this.data.targetPaths || this.DEFAULT_SCAN_PATTERNS;
      const exclude = [...this.DEFAULT_EXCLUDE, ...(this.data.excludePatterns || [])];

      const discoveryStartMeta = { baseDir, scanPatterns, excludePatterns: exclude.length };
      this.logInfo('Starting file discovery', discoveryStartMeta);
      
      const discoveredFiles: FileMetadata[] = [];
      const seenPaths = new Set<string>();
      let totalScanned = 0;
      
      for (const pattern of scanPatterns) {
        try {
          const fullPattern = path.join(baseDir, pattern);
          const files: string[] = await glob(fullPattern, {
            ignore: exclude,
            absolute: true,
            nodir: true,
            nocase: true,
          });
          
          totalScanned += files.length;
          
          for (const filePath of files) {
            // Deduplicate in case nocase matches the same file across patterns
            if (seenPaths.has(filePath)) continue;
            seenPaths.add(filePath);

            try {
              const stats = await fs.stat(filePath);
              const maxSize = parseInt(process.env.KB_DOCS_MAX_FILE_SIZE || '5242880'); // 5MB
              
              if (stats.size > maxSize) {
                this.logWarning(
                  'File exceeds maximum size, skipping',
                  { filePath, size: stats.size, maxSize },
                  'DiscoverREADMEFiles'
                );
                continue;
              }
              
              const relativePath = path.relative(baseDir, filePath);
              const metadata = this.extractMetadataFromPath(filePath, relativePath);
              
              discoveredFiles.push({
                path: filePath,
                relativePath,
                size: stats.size,
                modified: stats.mtime,
                moduleId: metadata.moduleId,
                category: metadata.category || 'general',
              });
            } catch (error: unknown) {
              this.logWarning(
                'Failed to stat file',
                { filePath, error: error instanceof Error ? error.message : String(error) },
                'DiscoverREADMEFiles'
              );
            }
          }
        } catch (error) {
          this.logError(
            `Failed to scan pattern: ${pattern}`,
            error,
            'DiscoverREADMEFiles'
          );
          ExecutionResult.persist(this.data);
          throw error;
        }
      }
      
      this.data.discoveredFiles = discoveredFiles;

      const discoveryDoneMeta = { totalScanned, uniqueFilesFound: discoveredFiles.length, scanPatterns };
      this.logInfo('File discovery complete', discoveryDoneMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('File discovery failed', error, 'DiscoverREADMEFiles');
      throw error;
    }
  }
  
  private extractMetadataFromPath(filePath: string, relativePath: string): Partial<FileMetadata> {
    const metadata: Partial<FileMetadata> = {
      category: 'general' as string,
    };
    
    // Extract module ID from path
    const moduleMatch = relativePath.match(/src\/modules\/([^/]+)/);
    if (moduleMatch) {
      metadata.moduleId = moduleMatch[1];
      metadata.category = 'module';
    }
    
    // Determine category
    if (relativePath.includes('/workflow/')) {
      metadata.category = 'workflow';
    } else if (relativePath.includes('/services/')) {
      metadata.category = 'service';
    } else if (relativePath.includes('/models/')) {
      metadata.category = 'model';
    } else if (relativePath.includes('/routes/')) {
      metadata.category = 'route';
    } else if (relativePath === 'README.md') {
      metadata.category = 'core';
    }
    
    return metadata;
  }
}

/**
 * Step 3: Calculate File Hashes
 */
class CalculateFileHashes extends CollectSystemDocsStep {
  private readonly PARALLEL_LIMIT = 10;
  
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {

      await this.initializeServices();
      
      const files = this.data.discoveredFiles || [];
      const hashStartMeta = { totalFiles: files.length, parallelLimit: this.PARALLEL_LIMIT };
      this.logInfo('Calculating file hashes', hashStartMeta);
      
      const fileManifest: FileWithHash[] = [];
      
      // Process files in batches
      for (let i = 0; i < files.length; i += this.PARALLEL_LIMIT) {
        const batch = files.slice(i, i + this.PARALLEL_LIMIT);
        const results = await Promise.allSettled(
          batch.map(file => this.processFile(file))
        );
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            fileManifest.push(result.value);
          } else if (result.status === 'rejected') {
            this.logWarning(
              'Failed to process file',
              { file: batch[index].path, error: result.reason },
              'CalculateFileHashes'
            );
          }
        });
      }
      
      this.data.fileManifest = fileManifest;

      const hashFailCount = files.length - fileManifest.length;
      const hashDoneMeta = { totalProcessed: fileManifest.length, failed: hashFailCount };
      this.logInfo('File hashing complete', hashDoneMeta);

      if (files.length > 0 && fileManifest.length === 0) {
        throw new Error(
          `Workflow failed: all ${files.length} discovered files failed during hash/read step. ` +
          `Check file permissions and paths.`
        );
      }

      return ExecutionResult.next();
    } catch (error) {
      this.logError('File hashing failed', error, 'CalculateFileHashes');
      throw error;
    }
  }
  
  private async processFile(file: FileMetadata): Promise<FileWithHash | null> {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      return {
        ...file,
        hash,
        content,
      };
    } catch (error) {
      logger.warn('[CollectSystemDocs] Failed to read file', { path: file.path, error: error.message });
      return null;
    }
  }
}

/**
 * Step 4: Load Existing Articles
 */
class LoadExistingArticles extends CollectSystemDocsStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      this.logInfo('Loading existing articles');
      
      const articles = await this.articleService.listArticles({
        knowledgeBaseId: this.data.kbId,
        tags: ['system-documentation'],
        limit: 10000,
        projection: {
          'metadata.sourcePath': 1,
          'metadata.sourceHash': 1,
          title: 1,
          slug: 1,
        },
      });
      
      const articleMap: Record<string, any> = {};
      const orphaned: any[] = [];
      
      for (const article of articles) {
        const sourcePath = (article as any).metadata?.sourcePath;
        if (sourcePath) {
          articleMap[sourcePath] = article;
        } else {          
          orphaned.push(article);
        }
      }
      
      this.data.existingArticles = articleMap;
      this.data.orphanedArticles = orphaned;
      
      const loadedMeta = { totalArticles: articles.length, mapped: Object.keys(articleMap).length, orphaned: orphaned.length };
      this.logInfo('Existing articles loaded', loadedMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Failed to load existing articles', error, 'LoadExistingArticles');
      throw error;
    }
  }
}

/**
 * Step 5: Classify File Changes
 */
class ClassifyFileChanges extends CollectSystemDocsStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      this.logInfo('Classifying file changes');
      
      const newFiles: FileWithHash[] = [];
      const updatedFiles: FileWithHash[] = [];
      const unchangedFiles: FileWithHash[] = [];
      
      for (const file of this.data.fileManifest || []) {
        const existing = this.data.existingArticles?.[file.path];
        
        if (!existing) {
          newFiles.push(file);
        } else if (this.data.forceFullScan || existing.metadata?.sourceHash !== file.hash) {
          updatedFiles.push(file);
        } else {
          unchangedFiles.push(file);
        }
      }
      
      this.data.newFiles = newFiles;
      this.data.updatedFiles = updatedFiles;
      this.data.unchangedFiles = unchangedFiles;
      
      const classifyMeta = { new: newFiles.length, updated: updatedFiles.length, unchanged: unchangedFiles.length };
      this.logInfo('File classification complete', classifyMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('File classification failed', error, 'ClassifyFileChanges');
      throw error;
    }
  }
}

/**
 * Step 6: Process New Files
 */
class ProcessNewFiles extends CollectSystemDocsStep {
  protected readonly PARALLEL_LIMIT = 5;
  
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      const files = this.data.newFiles || [];
      
      if (files.length === 0) {
        this.logInfo('No new files to process');
        return ExecutionResult.next();
      }

      const newFilesMeta = { totalFiles: files.length, parallelLimit: this.PARALLEL_LIMIT };
      this.logInfo('Processing new files', newFilesMeta);
      
      for (let i = 0; i < files.length; i += this.PARALLEL_LIMIT) {
        const batch = files.slice(i, i + this.PARALLEL_LIMIT);
        await this.processBatch(batch, 'created');
      }
      
      const newDoneMeta = { successful: this.data.successfulArticles?.filter(a => a.action === 'created').length, failed: this.data.failedFiles?.length };
      this.logInfo('New files processing complete', newDoneMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Processing new files failed', error, 'ProcessNewFiles');
      throw error;
    }
  }
  
  protected async processBatch(files: FileWithHash[], action: 'created' | 'updated'): Promise<void> {
    if (this.data.dryRun) {
      const dryRunMeta = { files: files.map(f => f.relativePath), action };
      this.logInfo('DRY RUN - Would process files', dryRunMeta);
      return;
    }
    
    const results = await Promise.allSettled(
      files.map(file => this.processFile(file, action))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.data.successfulArticles?.push(result.value);
      } else if (result.status === 'rejected') {
        this.data.failedFiles?.push({
          filePath: files[index].path,
          error: result.reason?.message || 'Unknown error',
          step: 'ProcessFiles',
        });
      }
    });
  }
  
  protected async processFile(file: FileWithHash, action: 'created' | 'updated'): Promise<ArticleResult> {
    const startTime = Date.now();
    
    const articleMetadata = {
      sourcePath: file.path,
      sourceRelativePath: file.relativePath,
      sourceHash: file.hash,
      moduleId: file.moduleId,
      lastSynced: new Date(),
      autoGenerated: true,
      documentationType: 'readme',
    };

    try {
      const metadata = this.extractArticleMetadata(file);
      const articleData = {
        title: metadata.title,
        description: metadata.description,
        content: file.content || '',
        kbId: this.data.kbId!,
        status: KBArticleStatus.PUBLISHED,
        lng: 'en',
        tags: metadata.tags,
        categories: metadata.categories,
        metadata: articleMetadata,
      };
      
      const article = await this.articleService.createArticle(articleData as any);
      
      return {
        articleId: article._id.toHexString(),
        filePath: file.path,
        action,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      // If the article already exists (orphaned record with no sourcePath), update it instead.
      // Extract the slug from the error message: 'Article with slug "<slug>" already exists'
      if (error instanceof Error && error.message.includes('already exists in this knowledge base')) {
        const slugMatch = /slug "([^"]+)" already exists/.exec(error.message);
        if (slugMatch) {
          try {
            const meta = this.extractArticleMetadata(file);
            // Do not pass kbId: orphaned articles have `parent` set but not `knowledgeBase`,
            // so the kbId filter in getArticleBySlug would not match them.
            const existing = await this.articleService.getArticleBySlug(slugMatch[1]);
            const updated = await this.articleService.updateArticle(
              (existing as any)._id?.toHexString() ?? (existing as any).id,
              {
                title: meta.title,
                description: meta.description,
                content: file.content || '',
                tags: meta.tags,
                categories: meta.categories,
                metadata: articleMetadata,
              } as any
            );
            return {
              articleId: (updated as any)._id?.toHexString() ?? (updated as any).id,
              filePath: file.path,
              action: 'updated',
              processingTime: Date.now() - startTime,
            };
          } catch (fallbackError) {
            const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            const fallbackErrMeta = { path: file.path, error: fallbackMsg };
            logger.error('[CollectSystemDocs] Failed to update orphaned article', fallbackErrMeta);
            this.resourceManager?.error('Failed to update orphaned article', fallbackErrMeta);
          }
        }
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      const errMeta = { path: file.path, error: errMsg };
      logger.error('[CollectSystemDocs] Failed to process file', errMeta);
      this.resourceManager?.error('Failed to process file', errMeta);
      throw error;
    }
  }
  
  protected extractArticleMetadata(file: FileWithHash): any {
    const content = file.content || '';
    const lines = content.split('\n');
    
    // Extract title from first H1
    let title = file.relativePath;
    const titleMatch = lines.find(line => line.startsWith('# '));
    if (titleMatch) {
      title = titleMatch.replace(/^#\s+/, '').trim();
    }
    
    // Extract description from first paragraph
    let description = '';
    const descLines: string[] = [];
    let inDescription = false;
    for (const line of lines) {
      if (line.startsWith('# ')) continue;
      if (line.trim() === '') {
        if (inDescription) break;
        continue;
      }
      if (!line.startsWith('#')) {
        inDescription = true;
        descLines.push(line);
        if (descLines.join(' ').length > 200) break;
      }
    }
    description = descLines.join(' ').substring(0, 500);
    
    // Generate tags
    const tags = new Set(['system-documentation', 'auto-generated']);
    if (file.moduleId) tags.add(file.moduleId);
    tags.add(file.category);
    
    // Generate categories
    const categories = [];
    if (file.category === 'core') {
      categories.push('Core Platform');
    } else if (file.category === 'module') {
      categories.push('Modules', file.moduleId || 'Unknown');
    } else {
      categories.push(file.category);
    }
    
    return {
      title,
      description,
      tags: Array.from(tags),
      categories,
    };
  }
}

/**
 * Step 7: Process Updated Files
 */
class ProcessUpdatedFiles extends ProcessNewFiles {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      const files = this.data.updatedFiles || [];
      
      if (files.length === 0) {
        this.logInfo('No updated files to process');
        return ExecutionResult.next();
      }

      const updatedFilesMeta = { totalFiles: files.length };
      this.logInfo('Processing updated files', updatedFilesMeta);
      
      for (let i = 0; i < files.length; i += this.PARALLEL_LIMIT) {
        const batch = files.slice(i, i + this.PARALLEL_LIMIT);
        await this.processUpdateBatch(batch);
      }
      
      const updDoneMeta = { successful: this.data.successfulArticles?.filter(a => a.action === 'updated').length, failed: this.data.failedFiles?.length };
      this.logInfo('Updated files processing complete', updDoneMeta);
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Processing updated files failed', error, 'ProcessUpdatedFiles');
      throw error;
    }
  }
  
  private async processUpdateBatch(files: FileWithHash[]): Promise<void> {
    if (this.data.dryRun) {
      const dryRunMeta = { files: files.map(f => f.relativePath) };
      this.logInfo('DRY RUN - Would update files', dryRunMeta);
      return;
    }
    
    const results = await Promise.allSettled(
      files.map(file => this.updateFile(file))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.data.successfulArticles?.push(result.value);
      } else if (result.status === 'rejected') {
        this.data.failedFiles?.push({
          filePath: files[index].path,
          error: result.reason?.message || 'Unknown error',
          step: 'ProcessUpdatedFiles',
        });
      }
    });
  }
  
  private async updateFile(file: FileWithHash): Promise<ArticleResult> {
    const startTime = Date.now();
    
    try {
      const existing = this.data.existingArticles?.[file.path];
      if (!existing) {
        throw new Error('Existing article not found');
      }
      
      const metadata = this.extractArticleMetadata(file);
      
      const article = await this.articleService.updateArticle(existing.id, {
        title: metadata.title,
        description: metadata.description,
        content: file.content || '',
        tags: metadata.tags,
        categories: metadata.categories,
        metadata: {
          ...existing.metadata,
          sourceHash: file.hash,
          lastSynced: new Date(),
        },
      } as any);
      
      return {
        articleId: article.id as string,
        filePath: file.path,
        action: 'updated',
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      const updateErrMeta = { path: file.path, error: error.message };
      logger.error('[CollectSystemDocs] Failed to update file', updateErrMeta);
      this.resourceManager?.error('Failed to update file', updateErrMeta);
      throw error;
    }
  }
}

/**
 * Step 8: Generate Workflow Report
 */
class GenerateWorkflowReport extends CollectSystemDocsStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      await this.initializeServices();
      
      const endTime = new Date();
      const duration = endTime.getTime() - (this.data.workflowStartTime?.getTime() || 0);
      
      const successfulArticles = this.data.successfulArticles || [];
      const avgProcessingTime = successfulArticles.length > 0
        ? successfulArticles.reduce((sum, a) => sum + a.processingTime, 0) / successfulArticles.length
        : 0;
      
      const stats: WorkflowStats = {
        discovery: {
          filesScanned: this.data.discoveredFiles?.length || 0,
          filesFound: this.data.fileManifest?.length || 0,
          scanPaths: this.data.targetPaths || [],
          errors: this.data.errorCount,
        },
        processing: {
          newArticles: successfulArticles.filter(a => a.action === 'created').length,
          updatedArticles: successfulArticles.filter(a => a.action === 'updated').length,
          unchangedFiles: this.data.unchangedFiles?.length || 0,
          failedFiles: this.data.failedFiles?.length || 0,
          totalProcessed: successfulArticles.length,
        },
        cleanup: {
          orphanedArticles: this.data.orphanedArticles?.length || 0,
          archivedArticles: this.data.archivedArticles?.length || 0,
        },
        performance: {
          avgProcessingTime,
          totalDuration: duration,
          peakMemoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        },
      };
      
      this.data.stats = stats;

      // Validate overall outcome: if every discovered file failed, the workflow itself has failed
      const filesFound = stats.discovery.filesFound;
      const failedFiles = stats.processing.failedFiles;
      if (filesFound > 0 && failedFiles >= filesFound && stats.processing.totalProcessed === 0) {
        const errorMsg =
          `Workflow failed: all ${filesFound} file(s) failed processing ` +
          `(${failedFiles} failures, 0 successes). ` +
          `Check the logs for details.`;
        logger.error(`[CollectSystemDocs] ${errorMsg}`, { stats });
        this.resourceManager?.error(errorMsg, { stats });
        throw new Error(errorMsg);
      }

      const completeMeta = { stats, errors: this.data.errorCount, warnings: this.data.warningCount, info: this.data.infoCount };
      this.logInfo('Workflow complete', completeMeta);

      // Archive the instance log and record the URL in the workflow stats
      try {
        const archiveUrl = await this.resourceManager?.archive();
        if (archiveUrl) {
          this.resourceManager?.info('Instance log archived', { archiveUrl });
        }
      } catch (archiveError) {
        logger.warn('[CollectSystemDocs] Failed to archive instance log', { error: archiveError instanceof Error ? archiveError.message : String(archiveError) });
      }

      // Close and deregister the resource manager
      if (this.data.instanceId) {
        await InstanceResourceManager.forInstance(this.data.instanceId)?.close();
      }

      return ExecutionResult.next();
    } catch (error) {
      this.logError('Report generation failed', error, 'GenerateWorkflowReport');
      throw error;
    }
  }
}

/**
 * Main Workflow Definition
 */
class CollectSystemDocsWorkflow implements WorkflowBase<CollectSystemDocsData> {
  id: string = 'kb.CollectSystemDocsWorkflow@1.0.0';
  version: string = '1.0.0';
  
  public build(builder: WorkflowBuilder<CollectSystemDocsData>): void {
    builder
      .startWith(
        InitializeKBContext,
        (step: StepBuilder<any, CollectSystemDocsData>) => {
          step.name('Initialize KB Context');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(DiscoverREADMEFiles, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Discover README Files');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(CalculateFileHashes, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Calculate File Hashes');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(LoadExistingArticles, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Load Existing Articles');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ClassifyFileChanges, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Classify File Changes');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ProcessNewFiles, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Process New Files');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ProcessUpdatedFiles, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Process Updated Files');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(GenerateWorkflowReport, (step: StepBuilder<any, CollectSystemDocsData>) => {
        step.name('Generate Workflow Report');
        })
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        });
  }
}

/**
 * Workflow Export Definition
 */
const CollectSystemDocsWorkflowDefinition: Reactory.Workflow.IWorkflow = {
  id: 'kb.CollectSystemDocsWorkflow@1.0.0',
  nameSpace: 'kb',
  name: 'CollectSystemDocsWorkflow',
  component: CollectSystemDocsWorkflow,
  category: 'workflow',
  autoStart: false,
  version: '1.0.0',
  author: 'Reactory',
  tags: ['knowledge-base', 'documentation', 'automation', 'system'],
  description: 'Collects and processes README documentation files from across the Reactory platform into a knowledge base',
} as Reactory.Workflow.IWorkflow;

export default CollectSystemDocsWorkflowDefinition;
