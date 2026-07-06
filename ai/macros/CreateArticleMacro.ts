/**
 * Create Article Macro
 *
 * AI tool for creating new knowledge base articles with multi-language support.
 * Conforms to the standard reactor macro/tool implementation: a `component`
 * function plus a `MacroComponentDefinition` registry entry, resolving services
 * from `state.context.getService(...)`.
 */

import { ChatState, MacroComponentDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import { IArticleService } from '@reactory/server-modules/reactory-kb/services/ArticleService';
import { IAIIntegrationService } from '@reactory/server-modules/reactory-kb/services/AIIntegrationService';

export interface CreateArticleMacroParams {
  /** ID of the knowledge base to create article in */
  kbId: string;
  /** Article title */
  title: string;
  /** Article content in markdown format */
  content: string;
  /** Default language code (e.g., "en", "fr", "es") */
  lng?: string;
  /** Brief description or summary of the article */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Category IDs for organization */
  categories?: string[];
}

const CreateArticleMacro = async (
  params: CreateArticleMacroParams,
  state: ChatState,
) => {
  const { context } = state;
  const { kbId, title, content, lng = 'en', description, tags = [], categories = [] } = params;

  if (!kbId || !title || !content) {
    return {
      success: false,
      error: 'kbId, title and content are required',
      tool: 'create_kb_article',
      params,
      instructions: `## Create Article — Missing Parameter\n\n**kbId**, **title** and **content** are all required.\n\n### Recovery Options:\n- Use \`list_knowledge_bases\` to find a valid kbId`,
    };
  }

  try {
    const articleService = context?.getService<IArticleService>('kb.ArticleService@1.0.0');
    const aiService = context?.getService<IAIIntegrationService>('kb.AIIntegrationService@1.0.0');

    if (!articleService) {
      return {
        success: false,
        error: 'ArticleService is not available',
        tool: 'create_kb_article',
        params,
        instructions: `## Create Article — Service Unavailable\n\nThe ArticleService is not registered.\n\n### Recovery Options:\n- Use \`svc\` with action="list" to check available services\n- Verify the reactory-kb module is loaded`,
      };
    }

    // If AI service is available, validate the content
    if (aiService) {
      const validation = await aiService.validateAIContent(content, {
        confidence: 0.9, // High confidence for manually triggered creation
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: `Content validation failed: ${validation.issues.join(', ')}`,
          suggestions: validation.suggestions,
          tool: 'create_kb_article',
          params,
          instructions: `## Create Article — Validation Failed\n\n${validation.issues.join(', ')}\n\n### Suggestions:\n${(validation.suggestions || []).map((s: string) => `- ${s}`).join('\n')}\n\n### Recovery Options:\n- Review and fix the content issues\n- Retry with updated content`,
        };
      }
    }

    const article = await articleService.createArticle({
      kbId,
      title,
      content,
      lng,
      description,
      tags,
      categories,
    });

    if (!state.vars) state.vars = {};
    state.vars.lastCreatedArticle = article;

    return {
      success: true,
      data: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        status: article.status,
        createdAt: article.createdAt,
      },
      tool: 'create_kb_article',
      params,
      message: `Article "${title}" created successfully`,
      instructions: `## Article Created\n\n**${title}** (ID: ${article.id}, slug: ${article.slug})\nStatus: ${article.status}\n\n### Suggested Next Steps:\n- Use \`search_kb_articles\` with query to verify the article appears in search\n- Use \`get_knowledge_base\` to see the parent KB\n- Create more articles with \`create_kb_article\``,
    };
  } catch (error) {
    context?.error?.('Error creating article', { error, params }, 'CreateArticleMacro');
    return {
      success: false,
      error: `Failed to create article: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'create_kb_article',
      params,
      instructions: `## Create Article — Error\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n### Recovery Options:\n- Verify the kbId is valid with \`list_knowledge_bases\`\n- Check the content and retry`,
    };
  }
};

export const CreateArticleMacroDefinition: MacroComponentDefinition<typeof CreateArticleMacro> = {
  nameSpace: 'kb',
  name: 'create_kb_article',
  version: '1.0.0',
  component: CreateArticleMacro,
  description: 'Create a new knowledge base article with multi-language support',
  alias: 'create_kb_article',
  runat: 'server',
  icon: 'post_add',
  roles: ['USER', 'ADMIN'],
  tools: [
    {
      type: 'function',
      roles: ['USER', 'ADMIN'],
      function: {
        icon: 'post_add',
        name: 'create_kb_article',
        description: 'Create a new article in a knowledge base with support for multiple languages',
        parameters: {
          type: 'object',
          properties: {
            kbId: {
              type: 'string',
              description: 'ID of the knowledge base to create article in',
            },
            title: {
              type: 'string',
              description: 'Article title',
            },
            content: {
              type: 'string',
              description: 'Article content in markdown format',
            },
            lng: {
              type: 'string',
              description: 'Default language code (e.g., "en", "fr", "es")',
              default: 'en',
            },
            description: {
              type: 'string',
              description: 'Brief description or summary of the article',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Category IDs for organization',
            },
          },
          required: ['kbId', 'title', 'content'],
        },
      },
    },
  ],
};

export default CreateArticleMacroDefinition;
