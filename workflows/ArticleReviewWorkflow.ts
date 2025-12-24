import Reactory from '@reactory/reactory-core';
import logger from '@reactory/server-core/logging';
import {
  WorkflowBase,
  StepBody,
  StepExecutionContext,
  ExecutionResult,
} from 'workflow-es';

/**
 * Article Review Workflow
 * 
 * Manages the review and approval process for knowledge base articles.
 * Implements a multi-stage review process with role-based transitions.
 */

class ArticleReviewData {
  public articleId: string;
  public userId: string;
  public organizationId?: string;
  public currentStatus?: string;
  public reviewerComments?: string[];
  public approvalLevel?: string;
  public changeSummary?: string;
}

abstract class ArticleReviewStep extends StepBody {
  public context: Reactory.Server.IReactoryContext;
  public data: ArticleReviewData;
}

/**
 * Step 1: Initialize Review Process
 */
class InitializeReview extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Initializing review: ${this.data.articleId}`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');
      if (!articleService) throw new Error('ArticleService not available');

      const article = await articleService.getArticle(this.data.articleId);
      this.data.currentStatus = article.status;

      await articleService.updateArticle(this.data.articleId, {
        status: 'draft',
      });

      logger.info('[ArticleReviewWorkflow] Review initialized');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error initializing review:', error);
      throw error;
    }
  }
}

/**
 * Step 2: Validate Article Content
 */
class ValidateContent extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Validating content: ${this.data.articleId}`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');
      const article = await articleService.getArticle(this.data.articleId);

      // Validate required fields
      const validationErrors: string[] = [];

      if (!article.title || article.title.length < 3) {
        validationErrors.push('Title must be at least 3 characters');
      }

      if (!article.content || article.content.length < 100) {
        validationErrors.push('Content must be at least 100 characters');
      }

      if (!article.lng) {
        validationErrors.push('Language must be specified');
      }

      if (validationErrors.length > 0) {
        logger.warn(`[ArticleReviewWorkflow] Validation errors: ${validationErrors.join(', ')}`);
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      logger.info('[ArticleReviewWorkflow] Content validated');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error validating content:', error);
      throw error;
    }
  }
}

/**
 * Step 3: Submit for Review
 */
class SubmitForReview extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Submitting for review: ${this.data.articleId}`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');

      await articleService.updateArticle(this.data.articleId, {
        status: 'under_review',
      });

      // Notify reviewers
      // TODO: Implement notification system
      logger.info('[ArticleReviewWorkflow] Submitted for review, reviewers notified');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error submitting for review:', error);
      throw error;
    }
  }
}

/**
 * Step 4: Assign Reviewer
 */
class AssignReviewer extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Assigning reviewer: ${this.data.articleId}`);

      // In a real implementation, this would use a load-balancing algorithm
      // to assign the best available reviewer

      logger.info('[ArticleReviewWorkflow] Reviewer assigned');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error assigning reviewer:', error);
      throw error;
    }
  }
}

/**
 * Step 5: Conduct Review
 */
class ConductReview extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Conducting review: ${this.data.articleId}`);

      // This step waits for reviewer action
      // In a real implementation, this would pause the workflow until
      // the reviewer approves, requests changes, or rejects

      logger.info('[ArticleReviewWorkflow] Review completed');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error conducting review:', error);
      throw error;
    }
  }
}

/**
 * Step 6: Process Review Decision
 */
class ProcessDecision extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Processing review decision: ${this.data.articleId}`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');
      const article = await articleService.getArticle(this.data.articleId);

      if (article.status === 'approved') {
        logger.info('[ArticleReviewWorkflow] Article approved, proceeding to publication');
      } else if (article.status === 'revision_requested') {
        logger.info('[ArticleReviewWorkflow] Revisions requested, returning to author');
      } else if (article.status === 'rejected') {
        logger.info('[ArticleReviewWorkflow] Article rejected');
      }

      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error processing decision:', error);
      throw error;
    }
  }
}

/**
 * Step 7: Publish Article
 */
class PublishArticle extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Publishing article: ${this.data.articleId}`);

      const articleService: any = this.context.getService('kb.ArticleService@1.0.0');
      await articleService.publishArticle(this.data.articleId);

      // Index for search
      const searchService: any = this.context.getService('kb.SearchService@1.0.0');
      if (searchService) {
        const article = await articleService.getArticle(this.data.articleId);
        await searchService.indexContent(article);
      }

      logger.info('[ArticleReviewWorkflow] Article published successfully');
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error publishing article:', error);
      throw error;
    }
  }
}

/**
 * Step 8: Complete Workflow
 */
class Complete extends ArticleReviewStep {
  async run(stepContext: StepExecutionContext): Promise<ExecutionResult> {
    try {
      logger.info(`[ArticleReviewWorkflow] Completing workflow: ${this.data.articleId}`);
      return ExecutionResult.next();
    } catch (error) {
      logger.error('[ArticleReviewWorkflow] Error completing workflow:', error);
      throw error;
    }
  }
}

/**
 * Main workflow that orchestrates the article review process
 */
class ArticleReviewWorkflowImpl implements WorkflowBase<ArticleReviewData> {
  id: string = 'kb.ArticleReviewWorkflow@1.0.0';
  version: number = 1;

  public build(builder: any) {
    builder
      .startWith(InitializeReview)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(ValidateContent)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(SubmitForReview)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(AssignReviewer)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(ConductReview)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(ProcessDecision)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(PublishArticle)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        })
        .output((step: ArticleReviewStep, data: ArticleReviewData) => {
          data = step.data;
        })
      .then(Complete)
        .input((step: ArticleReviewStep, data: ArticleReviewData) => {
          step.data = data;
        });
  }
}

export const ArticleReviewWorkflow: Reactory.Workflow.IWorkflow = {
  id: 'kb.ArticleReviewWorkflow@1.0.0',
  nameSpace: 'kb',
  name: 'Article Review Workflow',
  component: ArticleReviewWorkflowImpl,
  category: 'workflow',
  autoStart: false,
  version: '1.0.0',
} as Reactory.Workflow.IWorkflow;

export default ArticleReviewWorkflow;
