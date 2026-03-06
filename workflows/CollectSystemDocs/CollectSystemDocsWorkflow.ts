import Reactory from '@reactorynet/reactory-core';
import logger from '@reactory/server-core/logging';
import {
  WorkflowBase,
  StepBody,
  StepExecutionContext,
  ExecutionResult,
} from 'workflow-es';
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
  public errors?: ErrorDetail[] = [];
  public warnings?: WarningDetail[] = [];
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

interface ErrorDetail {
  step: string;
  error: string;
  context: any;
}

interface WarningDetail {
  step: string;
  message: string;
  context: any;
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
  
  async initializeServices(): Promise<void> {
    const {
      username = process.env.KB_SYSTEM_USER || 'kb@reactory.net',
    } = this.data;
    // establish a context for the workflow if we don't have one already (should be provided by the workflow engine, but just in case)
    if (!this.context) {
      const ctx: any = await ReactoryContextProvider(null, null);
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
    this.context.error(message, { error: error.message, stack: error.stack }, step);
    this.data.errors?.push({
      step,
      error: error.message,
      context: { message, stack: error.stack }
    });
  }
  
  protected logWarning(message: string, context: any, step: string): void {
    this.context.warn(message, context, step);
    this.data.warnings?.push({
      step,
      message,
      context
    });
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
      this.data.errors = [];
      this.data.warnings = [];
      this.data.successfulArticles = [];
      this.data.failedFiles = [];
      
      logger.info('[CollectSystemDocs] Initializing workflow context');
      
      // Find or create "System Documentation" KB
      const kbName = process.env.KB_SYSTEM_DOCS_NAME || 'System Documentation';
      const kbSlug = 'system-documentation';
      
      let kb;
      try { 
        kb = await this.kbService.getKnowledgeBaseBySlug(kbSlug);
      }
      catch (notFoundError) { 
        logger.warn(`[CollectSystemDocs] KB "${kbName}" not found, will create a new one`, { slug: kbSlug });        
      }
      
      if (!kb && (process.env.KB_SYSTEM_DOCS_AUTO_CREATE !== 'false')) {
        logger.info('[CollectSystemDocs] Creating System Documentation KB');
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
      
      this.data.kbId = kb.id as string;
      
      logger.info('[CollectSystemDocs] KB Context initialized', {
        kbId: this.data.kbId,
        kbName: kb.title,
      });
      
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
      
      logger.info('[CollectSystemDocs] Starting file discovery', {
        baseDir,
        scanPatterns,
        excludePatterns: exclude.length,
      });
      
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
      
      logger.info('[CollectSystemDocs] File discovery complete', {
        totalScanned,
        uniqueFilesFound: discoveredFiles.length,
        scanPatterns,
      });
      
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
      logger.info('[CollectSystemDocs] Calculating file hashes', {
        totalFiles: files.length,
        parallelLimit: this.PARALLEL_LIMIT,
      });
      
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
      
      logger.info('[CollectSystemDocs] File hashing complete', {
        totalProcessed: fileManifest.length,
        failed: files.length - fileManifest.length,
      });
      
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
      logger.warn('[CollectSystemDocs] Failed to read file', {
        path: file.path,
        error: error.message,
      });
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
      
      logger.info('[CollectSystemDocs] Loading existing articles');
      
      const articles = await this.articleService.listArticles({
        knowledgeBaseId: this.data.kbId,
        tags: ['system-documentation'],
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
      
      logger.info('[CollectSystemDocs] Existing articles loaded', {
        totalArticles: articles.length,
        mapped: Object.keys(articleMap).length,
        orphaned: orphaned.length,
      });
      
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
      
      logger.info('[CollectSystemDocs] Classifying file changes');
      
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
      
      logger.info('[CollectSystemDocs] File classification complete', {
        new: newFiles.length,
        updated: updatedFiles.length,
        unchanged: unchangedFiles.length,
      });
      
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
        logger.info('[CollectSystemDocs] No new files to process');
        return ExecutionResult.next();
      }
      
      logger.info('[CollectSystemDocs] Processing new files', {
        totalFiles: files.length,
        parallelLimit: this.PARALLEL_LIMIT,
      });
      
      for (let i = 0; i < files.length; i += this.PARALLEL_LIMIT) {
        const batch = files.slice(i, i + this.PARALLEL_LIMIT);
        await this.processBatch(batch, 'created');
      }
      
      logger.info('[CollectSystemDocs] New files processing complete', {
        successful: this.data.successfulArticles?.filter(a => a.action === 'created').length,
        failed: this.data.failedFiles?.length,
      });
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Processing new files failed', error, 'ProcessNewFiles');
      throw error;
    }
  }
  
  protected async processBatch(files: FileWithHash[], action: 'created' | 'updated'): Promise<void> {
    if (this.data.dryRun) {
      logger.info('[CollectSystemDocs] DRY RUN - Would process files', {
        files: files.map(f => f.relativePath),
        action,
      });
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
    
    try {
      const metadata = this.extractArticleMetadata(file);
      const articleData = {
        title: metadata.title,
        description: metadata.description,
        content: file.content || '',
        knowledgeBaseId: this.data.kbId!,
        status: KBArticleStatus.PUBLISHED,
        lng: 'en',
        tags: metadata.tags,
        categories: metadata.categories,
        metadata: {
          sourcePath: file.path,
          sourceRelativePath: file.relativePath,
          sourceHash: file.hash,
          moduleId: file.moduleId,
          lastSynced: new Date(),
          autoGenerated: true,
          documentationType: 'readme',
        },
      };
      
      const article = await this.articleService.createArticle(articleData as any);
      
      return {
        articleId: article.id as string,
        filePath: file.path,
        action,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('[CollectSystemDocs] Failed to process file', {
        path: file.path,
        error: error.message,
      });
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
        logger.info('[CollectSystemDocs] No updated files to process');
        return ExecutionResult.next();
      }
      
      logger.info('[CollectSystemDocs] Processing updated files', {
        totalFiles: files.length,
      });
      
      for (let i = 0; i < files.length; i += this.PARALLEL_LIMIT) {
        const batch = files.slice(i, i + this.PARALLEL_LIMIT);
        await this.processUpdateBatch(batch);
      }
      
      logger.info('[CollectSystemDocs] Updated files processing complete', {
        successful: this.data.successfulArticles?.filter(a => a.action === 'updated').length,
        failed: this.data.failedFiles?.length,
      });
      
      return ExecutionResult.next();
    } catch (error) {
      this.logError('Processing updated files failed', error, 'ProcessUpdatedFiles');
      throw error;
    }
  }
  
  private async processUpdateBatch(files: FileWithHash[]): Promise<void> {
    if (this.data.dryRun) {
      logger.info('[CollectSystemDocs] DRY RUN - Would update files', {
        files: files.map(f => f.relativePath),
      });
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
      logger.error('[CollectSystemDocs] Failed to update file', {
        path: file.path,
        error: error.message,
      });
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
          errors: this.data.errors?.length || 0,
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
      
      logger.info('[CollectSystemDocs] Workflow complete', {
        stats,
        errors: this.data.errors?.length,
        warnings: this.data.warnings?.length,
      });
      
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
  version: number = 1;
  
  public build(builder: any) {
    builder
      .startWith(InitializeKBContext)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(DiscoverREADMEFiles)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(CalculateFileHashes)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(LoadExistingArticles)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ClassifyFileChanges)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ProcessNewFiles)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(ProcessUpdatedFiles)
        .input((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          step.data = data;
        })
        .output((step: CollectSystemDocsStep, data: CollectSystemDocsData) => {
          data = step.data;
        })
      .then(GenerateWorkflowReport)
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
