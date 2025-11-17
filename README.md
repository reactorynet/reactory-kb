# Reactory Knowledge Base Module

The Reactory Knowledge Base (KB) Module is a comprehensive knowledge management system that enables users and AI agents to create, manage, and share knowledge bases within the Reactory platform. This module provides a robust framework for organizing, searching, and collaborating on knowledge resources.

## Overview

The Knowledge Base module allows users to:
- Create and manage personal or organizational knowledge bases
- Control access and visibility (private, public, or shared)
- Organize knowledge using categories, tags, and hierarchical structures
- Perform full-text search across knowledge bases
- Enable AI agents to interact with and contribute to knowledge bases
- Version control and audit trails for knowledge articles
- Rich content support including markdown, code snippets, and embedded media
- Collaborative editing and review workflows

## Features

### Core Capabilities
- **Knowledge Base Management**: Create, update, delete, and organize knowledge bases
- **Article Management**: CRUD operations for knowledge articles with rich content support
- **Access Control**: Granular permissions for private, public, and shared knowledge bases
- **Search & Discovery**: Full-text search with filtering and faceted navigation
- **AI Integration**: Allow AI agents to read from and contribute to knowledge bases
- **Version Control**: Track changes and maintain article history
- **Collaboration**: Multi-user editing with conflict resolution
- **Categories & Tags**: Organize content with flexible taxonomy
- **Import/Export**: Bulk import and export of knowledge bases

### Module Structure

```
reactory-kb/
├── cli/                    # Command-line interface tools
│   └── index.ts           # KB CLI commands
├── services/              # Business logic services
│   └── index.ts          # KB services (KnowledgeBaseService, ArticleService, etc.)
├── models/                # Database models
│   └── index.ts          # Mongoose models for KB entities
├── graphql/               # GraphQL definitions
│   ├── types/            # GraphQL type definitions
│   │   └── index.ts      # KB types (KnowledgeBase, Article, etc.)
│   └── resolvers/        # GraphQL resolvers
│       └── index.ts      # Query and mutation resolvers
├── forms/                 # Form definitions
│   └── index.ts          # KB form schemas
├── workflow/              # Workflow definitions
│   └── index.ts          # KB workflows (review, approval, etc.)
├── data/                  # Static data and migrations
├── routes/                # REST API routes
│   └── index.ts          # Express routes for KB
├── middleware/            # Custom middleware
│   └── index.ts          # KB-specific middleware
├── hooks/                 # Lifecycle hooks
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── index.ts              # Module entry point
└── README.md             # This file
```

## Installation

The Knowledge Base module is part of the Reactory platform. To enable it:

1. Ensure the module is present in `src/modules/reactory-kb`
2. Add the module to your enabled modules configuration
3. Restart the Reactory server

## Configuration

Set the following environment variables to configure the module:

```bash
# Knowledge Base Configuration
KB_DEFAULT_VISIBILITY=private          # Default visibility for new KBs
KB_ENABLE_AI_CONTRIBUTIONS=true        # Allow AI agents to contribute
KB_MAX_ARTICLE_SIZE=1048576           # Maximum article size in bytes (1MB)
KB_ENABLE_VERSIONING=true             # Enable version control
KB_SEARCH_PROVIDER=elasticsearch       # Search provider (elasticsearch, meilisearch, etc.)
```

## Services

The module provides the following core services:

### KnowledgeBaseService
Manages knowledge base entities including:
- Create, read, update, delete knowledge bases
- Manage KB permissions and visibility
- List and search knowledge bases
- KB statistics and analytics

### ArticleService
Handles knowledge article operations:
- CRUD operations for articles
- Rich content management
- Version control and history
- Article search and filtering

### SearchService
Provides search capabilities:
- Full-text search across articles
- Faceted search and filtering
- Search indexing and optimization
- Search analytics

### CollaborationService
Enables collaborative features:
- Multi-user editing support
- Change tracking and notifications
- Conflict resolution
- Review and approval workflows

### AIIntegrationService
Facilitates AI agent interactions:
- AI-readable knowledge formatting
- AI contribution validation
- Context-aware knowledge retrieval
- AI learning from knowledge bases

## GraphQL API

The module exposes the following GraphQL types and operations:

### Types

```graphql
type KnowledgeBase {
  id: ID!
  name: String!
  description: String
  visibility: KBVisibility!
  owner: User!
  categories: [Category!]!
  articles: [Article!]!
  permissions: [Permission!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  stats: KBStats
}

type Article {
  id: ID!
  title: String!
  content: String!
  summary: String
  knowledgeBase: KnowledgeBase!
  author: User!
  categories: [Category!]!
  tags: [String!]!
  version: Int!
  status: ArticleStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum KBVisibility {
  PRIVATE
  PUBLIC
  SHARED
  ORGANIZATION
}

enum ArticleStatus {
  DRAFT
  UNDER_REVIEW
  PUBLISHED
  ARCHIVED
}
```

### Queries

```graphql
# Get knowledge base by ID
knowledgeBase(id: ID!): KnowledgeBase

# List knowledge bases
knowledgeBases(
  visibility: KBVisibility
  search: String
  limit: Int
  offset: Int
): [KnowledgeBase!]!

# Get article by ID
article(id: ID!): Article

# Search articles
searchArticles(
  query: String!
  knowledgeBaseId: ID
  categories: [ID!]
  tags: [String!]
  limit: Int
  offset: Int
): ArticleSearchResult!
```

### Mutations

```graphql
# Create knowledge base
createKnowledgeBase(input: CreateKBInput!): KnowledgeBase!

# Update knowledge base
updateKnowledgeBase(id: ID!, input: UpdateKBInput!): KnowledgeBase!

# Delete knowledge base
deleteKnowledgeBase(id: ID!): Boolean!

# Create article
createArticle(input: CreateArticleInput!): Article!

# Update article
updateArticle(id: ID!, input: UpdateArticleInput!): Article!

# Delete article
deleteArticle(id: ID!): Boolean!

# Share knowledge base
shareKnowledgeBase(id: ID!, input: ShareKBInput!): KnowledgeBase!
```

## Models

The module defines the following Mongoose models:

- **KnowledgeBase**: Core KB entity with metadata and permissions
- **Article**: Knowledge article with content and versioning
- **Category**: Hierarchical categorization system
- **Tag**: Flexible tagging system
- **Permission**: Access control and sharing permissions
- **Version**: Article version history
- **Comment**: Collaborative comments on articles
- **Bookmark**: User bookmarks for quick access

## Workflows

The module includes the following workflows:

### Article Review Workflow
Manages the review and approval process for articles:
1. Draft creation
2. Submit for review
3. Review and feedback
4. Approval or revision request
5. Publication

### Knowledge Sync Workflow
Synchronizes knowledge bases with external sources:
1. Connect to external source
2. Import content
3. Map and transform data
4. Create or update articles
5. Schedule regular syncs

### AI Learning Workflow
Enables AI agents to learn from knowledge bases:
1. Access knowledge base
2. Extract relevant information
3. Process and index content
4. Update AI knowledge models
5. Validate and audit AI contributions

## CLI Commands

The module provides CLI commands for administrative tasks:

```bash
# Create a knowledge base
reactory kb:create --name "My KB" --visibility private

# Import knowledge base from file
reactory kb:import --file ./knowledge-base.json

# Export knowledge base
reactory kb:export --id <kb-id> --output ./export.json

# Reindex knowledge bases for search
reactory kb:reindex

# Generate KB statistics
reactory kb:stats --id <kb-id>
```

## Usage Examples

### Creating a Knowledge Base (GraphQL)

```graphql
mutation {
  createKnowledgeBase(input: {
    name: "Engineering Best Practices"
    description: "Internal engineering knowledge base"
    visibility: ORGANIZATION
  }) {
    id
    name
    visibility
    createdAt
  }
}
```

### Creating an Article

```graphql
mutation {
  createArticle(input: {
    knowledgeBaseId: "kb-123"
    title: "How to Deploy to Production"
    content: "## Deployment Process\n\n1. Run tests..."
    tags: ["deployment", "production", "devops"]
    status: DRAFT
  }) {
    id
    title
    status
    createdAt
  }
}
```

### Searching Articles

```graphql
query {
  searchArticles(
    query: "deployment best practices"
    knowledgeBaseId: "kb-123"
    limit: 10
  ) {
    total
    results {
      id
      title
      summary
      relevanceScore
    }
  }
}
```

## AI Agent Integration

AI agents can interact with knowledge bases through:

1. **Reading**: Access public or permitted knowledge bases
2. **Contributing**: Create or update articles (with appropriate permissions)
3. **Learning**: Extract knowledge to enhance AI capabilities
4. **Validation**: AI-generated content can be reviewed by humans

Example AI agent usage:

```typescript
// AI agent reading from KB
const knowledge = await context.services.kb.getArticlesForAI({
  knowledgeBaseId: 'kb-123',
  topic: 'deployment',
  format: 'structured'
});

// AI agent contributing to KB
await context.services.kb.createArticleFromAI({
  knowledgeBaseId: 'kb-123',
  title: 'AI-Generated Deployment Guide',
  content: generatedContent,
  metadata: {
    generatedBy: 'ai-agent-001',
    confidence: 0.95
  }
});
```

## Security & Permissions

The module implements comprehensive security:

- **Authentication**: All operations require authenticated users
- **Authorization**: Role-based and permission-based access control
- **Visibility Control**: Private, public, shared, and organization-level access
- **Audit Logging**: All operations are logged for compliance
- **Content Validation**: Input sanitization and validation
- **Rate Limiting**: Prevent abuse and ensure fair usage

## Development

### Adding a New Service

1. Create service file in `services/`
2. Implement service interface
3. Register in `services/index.ts`
4. Add service to module dependencies

### Adding GraphQL Types

1. Create type definition in `graphql/types/`
2. Export from `graphql/types/index.ts`
3. Create resolver in `graphql/resolvers/`
4. Export from `graphql/resolvers/index.ts`

### Adding a Model

1. Create Mongoose schema in `models/`
2. Export from `models/index.ts`
3. Update TypeScript types in `types/`

## Testing

Run module tests:

```bash
# Run all KB module tests
npm test -- reactory-kb

# Run specific test suite
npm test -- reactory-kb/services

# Run with coverage
npm test -- --coverage reactory-kb
```

## Contributing

Contributions are welcome! Please:

1. Follow the Reactory coding standards
2. Write tests for new features
3. Update documentation
4. Submit pull requests for review

## License

This module is part of the Reactory platform and follows the same licensing terms.

## Support

For issues, questions, or feature requests:
- GitHub Issues: [reactory-express-server/issues](https://github.com/reactorynet/reactory-express-server/issues)
- Documentation: [reactory-platform.com/docs](https://reactory-platform.com/docs)
- Community: [Reactory Discord](https://discord.gg/reactory)

## Roadmap

Future enhancements planned for the Knowledge Base module:

- [ ] Advanced AI-powered search with semantic understanding
- [ ] Knowledge graph visualization
- [ ] Multi-language support with automatic translation
- [ ] Integration with external knowledge sources (Confluence, Notion, etc.)
- [ ] Advanced analytics and insights
- [ ] Mobile SDK for native app integration
- [ ] Real-time collaborative editing
- [ ] Knowledge base templates and blueprints
- [ ] Machine learning-based content recommendations
- [ ] Integration with Reactory Reactor for AI-enhanced features

## Version History

### 1.0.0 (Initial Release)
- Core knowledge base and article management
- GraphQL API
- Search functionality
- Basic access control
- CLI tools
- Service layer implementation
