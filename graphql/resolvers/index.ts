import Reactory from '@reactory/reactory-core';

/**
 * Knowledge Base GraphQL Resolvers
 * 
 * Query resolvers:
 * - knowledgeBase: Get KB by ID
 * - knowledgeBases: List KBs
 * - article: Get article by ID
 * - searchArticles: Search articles
 * 
 * Mutation resolvers:
 * - createKnowledgeBase
 * - updateKnowledgeBase
 * - deleteKnowledgeBase
 * - createArticle
 * - updateArticle
 * - deleteArticle
 * - shareKnowledgeBase
 */

const resolvers: Reactory.Server.IReactoryResolver = {};

export default resolvers;
