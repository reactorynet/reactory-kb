/**
 * Create Article Macro
 * 
 * AI tool for creating new knowledge base articles
 */

import Reactory from '@reactorynet/reactory-core';

export const CreateArticleMacro: Reactory.AI.MacroToolDefinition = {
  name: 'create_kb_article',
  description: 'Create a new knowledge base article with multi-language support',
  type: 'function',
  function: {
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
  roles: ['USER', 'ADMIN'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const articleService = context.services.kb?.ArticleService;
    const aiService = context.services.kb?.AIIntegrationService;
    
    if (!articleService) {
      throw new Error('ArticleService not available');
    }

    // If AI service is available, validate the content
    if (aiService) {
      const validation = await aiService.validateAIContent(params.content, {
        confidence: 0.9, // High confidence for manually triggered creation
      });
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Content validation failed: ${validation.issues.join(', ')}`,
          suggestions: validation.suggestions,
          instructions: `## Create Article \u2014 Validation Failed\n\n${validation.issues.join(', ')}\n\n### Suggestions:\n${(validation.suggestions || []).map((s: string) => `- ${s}`).join('\n')}\n\n### Recovery Options:\n- Review and fix the content issues\n- Retry with updated content`
        };
      }
    }

    const article = await articleService.createArticle({
      kbId: params.kbId,
      title: params.title,
      content: params.content,
      lng: params.lng || 'en',
      description: params.description,
      tags: params.tags || [],
      categories: params.categories || [],
    });

    return {
      success: true,
      data: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        status: article.status,
        createdAt: article.createdAt,
      },
      message: `Article "${params.title}" created successfully`,
      instructions: `## Article Created\n\n**${params.title}** (ID: ${article.id}, slug: ${article.slug})\nStatus: ${article.status}\n\n### Suggested Next Steps:\n- Use \`search_kb_articles\` with query to verify the article appears in search\n- Use \`get_knowledge_base\` to see the parent KB\n- Create more articles with \`create_kb_article\``
    };
  },
};

export default CreateArticleMacro;

