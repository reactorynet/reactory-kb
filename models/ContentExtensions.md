# Knowledge Base Content Model Extensions

## Overview

The Knowledge Base module extends the existing `IReactoryContent` model from `reactory-core` rather than creating a new model. This approach leverages the existing Content infrastructure while adding KB-specific functionality through additional fields.

## Base Content Model

The base `IReactoryContent` interface from `reactory-core/models/Content.ts` provides:

```typescript
interface IReactoryContent {
  id?: unknown;
  slug: string;                    // Unique identifier
  title?: string;                  // Content title
  description?: string;            // Content description
  content: string;                 // Main content (markdown/html)
  topics?: string[];               // Topic tags
  template?: boolean;              // Is this a template?
  engine?: string;                 // Rendering engine
  previewInputForm?: string;       // Preview form FQN
  createdAt: Date;                 // Creation timestamp
  createdBy: ObjectId | IUser;     // Creator
  updatedAt: Date;                 // Last update timestamp
  updatedBy: ObjectId | IUser;     // Last updater
  version?: string;                // Version string
  published: boolean;              // Published status
  roles?: string[];                // Access roles
  commentsAllowed?: boolean;       // Comments enabled
  comments?: ObjectId[];           // Comment references
  commentRoles?: string[];         // Comment access roles
  partner?: ObjectId;              // Client/partner reference
  organization?: ObjectId;         // Organization reference
  businessUnit?: ObjectId;         // Business unit reference
  flags?: IContentFlag[];          // Content flags
  flagged?: boolean;               // Flagged status
}
```

## KB-Specific Extensions

The Knowledge Base module extends this model with the following additional fields:

### Field Extensions

```typescript
interface IKBContent extends IReactoryContent {
  // Content Type Classification
  contentType: KBContentType;           // 'knowledge-base' | 'article' | 'category' | 'template' | 'book' | 'chapter' | 'section' | 'page'
  
  // Multi-language Support
  lng?: string;                         // Default language ISO code (e.g., 'en', 'fr', 'es')
  localizedContent?: IKBLocalizedContent[]; // Array of localized content variants
  
  // Knowledge Base Relationships
  knowledgeBase?: ObjectId;             // Reference to parent KB (for articles)
  categories?: ObjectId[];              // Article categories
  tags?: string[];                      // Article tags (different from topics)
  
  // KB Metadata
  status?: KBArticleStatus;             // 'draft' | 'under_review' | 'published' | 'archived'
  visibility?: KBVisibility;            // 'private' | 'public' | 'shared' | 'organization'
  allowComments?: boolean;              // Override commentsAllowed with KB-specific flag
  viewCount?: number;                   // View counter
  lastViewed?: Date;                    // Last viewed timestamp
  
  // Relationships (stored as arrays of ObjectIds)
  attachments?: ObjectId[];             // File attachments (references to KBAttachment)
  bookmarks?: ObjectId[];               // User bookmarks (references to KBBookmark)
  
  // Hierarchical Content (for books/chapters/sections)
  parentContent?: ObjectId;             // Parent content (for nested structures)
  childContent?: ObjectId[];            // Child content items
  order?: number;                       // Order within parent
}
```

## Content Type Usage

### 1. Knowledge Base (`contentType: 'knowledge-base'`)

**Purpose**: Container for organizing articles

**Fields Used**:
- `slug`: Unique KB identifier
- `title`: KB name
- `description`: KB description
- `content`: Optional KB overview content
- `lng`: Default language for the KB
- `visibility`: Access control level
- `published`: KB active status
- `partner`, `organization`, `businessUnit`: Organizational scope
- `roles`: Access control roles
- `createdBy`, `createdAt`, `updatedBy`, `updatedAt`: Audit fields

**Query Example**:
```typescript
const kb = await Content.findOne({ 
  slug: 'technical-docs', 
  contentType: 'knowledge-base' 
});
```

### 2. Article (`contentType: 'article'`)

**Purpose**: Individual knowledge base articles

**Fields Used**:
- All base fields plus:
- `knowledgeBase`: Reference to parent KB
- `categories`: Article categorization
- `tags`: Article tags
- `status`: Article workflow status
- `lng`: Article default language
- `localizedContent`: Translations
- `attachments`: Linked files
- `bookmarks`: User bookmarks
- `viewCount`, `lastViewed`: Analytics
- `allowComments`, `comments`: Discussion

**Query Example**:
```typescript
const articles = await Content.find({ 
  contentType: 'article',
  knowledgeBase: kbId,
  status: 'published'
});
```

### 3. Category (`contentType: 'category'`)

**Purpose**: Hierarchical organization of articles

**Fields Used**:
- `slug`: Category identifier
- `title`: Category name
- `description`: Category description
- `parentContent`: Parent category reference
- `childContent`: Child categories
- `order`: Display order
- `knowledgeBase`: Parent KB reference

**Query Example**:
```typescript
const rootCategories = await Content.find({ 
  contentType: 'category',
  knowledgeBase: kbId,
  parentContent: null
});
```

### 4. Template (`contentType: 'template'`)

**Purpose**: Reusable content templates

**Fields Used**:
- `slug`: Template identifier
- `title`: Template name
- `description`: Template description
- `content`: Template content with placeholders
- `lng`: Template language
- `template`: Set to `true`
- `engine`: Template engine ('lodash', 'ejs', 'template-string')

**Query Example**:
```typescript
const templates = await Content.find({ 
  contentType: 'template',
  published: true
});
```

### 5. Book/Chapter/Section/Page (`contentType: 'book'|'chapter'|'section'|'page'`)

**Purpose**: Hierarchical book-style documentation

**Fields Used**:
- All article fields plus:
- `parentContent`: Parent in hierarchy
- `childContent`: Children in hierarchy
- `order`: Display order within parent

**Hierarchy**:
- Book → Chapters → Sections → Pages

**Query Example**:
```typescript
const book = await Content.findOne({ 
  contentType: 'book',
  slug: 'user-guide'
});

const chapters = await Content.find({
  contentType: 'chapter',
  parentContent: book._id
}).sort({ order: 1 });
```

## Localized Content Structure

The `localizedContent` field stores translations within the same document:

```typescript
interface IKBLocalizedContent {
  lng: string;                    // Language code
  title?: string;                 // Localized title
  content?: string;               // Localized content
  summary?: string;               // Localized summary
  description?: string;           // Localized description
  published: boolean;             // Publication status for this language
  created: Date;                  // When created
  modified: Date;                 // When last modified
  modifiedBy?: ObjectId;          // Who modified
}
```

**Example**:
```typescript
{
  slug: 'getting-started',
  title: 'Getting Started',
  content: 'Welcome to...',
  lng: 'en',
  localizedContent: [
    {
      lng: 'es',
      title: 'Comenzando',
      content: 'Bienvenido a...',
      published: true,
      created: new Date(),
      modified: new Date()
    },
    {
      lng: 'fr',
      title: 'Commencer',
      content: 'Bienvenue à...',
      published: true,
      created: new Date(),
      modified: new Date()
    }
  ]
}
```

## Database Indexes

Additional indexes should be created for KB queries:

```javascript
// Compound indexes for KB queries
ContentSchema.index({ contentType: 1, knowledgeBase: 1, status: 1 });
ContentSchema.index({ contentType: 1, published: 1, lng: 1 });
ContentSchema.index({ knowledgeBase: 1, createdAt: -1 });
ContentSchema.index({ contentType: 1, slug: 1 }, { unique: true });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ 'localizedContent.lng': 1 });
ContentSchema.index({ parentContent: 1, order: 1 });
```

## Migration Strategy

To add KB functionality to existing Content documents:

1. **No breaking changes**: All new fields are optional
2. **Backward compatible**: Existing content continues to work
3. **Gradual migration**: Content can be migrated as needed

### Migration Script Example

```typescript
// Add contentType to existing content
await Content.updateMany(
  { contentType: { $exists: false } },
  { $set: { contentType: 'article' } }
);

// Add default language
await Content.updateMany(
  { lng: { $exists: false } },
  { $set: { lng: 'en' } }
);

// Initialize empty arrays
await Content.updateMany(
  { attachments: { $exists: false } },
  { $set: { attachments: [], bookmarks: [] } }
);
```

## Usage in Services

Services should always specify `contentType` when querying:

```typescript
// KnowledgeBaseService
async getKnowledgeBase(slug: string): Promise<IKBContent> {
  return await Content.findOne({ 
    slug, 
    contentType: 'knowledge-base' 
  });
}

// ArticleService
async getArticle(id: string): Promise<IKBContent> {
  return await Content.findById(id)
    .where('contentType').equals('article')
    .populate('knowledgeBase')
    .populate('categories')
    .exec();
}
```

## Benefits of This Approach

1. **Reuse existing infrastructure**: Content service, GraphQL, forms
2. **Unified content management**: All content in one collection
3. **Simpler queries**: No complex joins
4. **Flexible schema**: Easy to add new content types
5. **Better performance**: Single collection, compound indexes
6. **Atomic operations**: Localized content in same document

## Considerations

1. **Document size**: Monitor document size with large `localizedContent` arrays
2. **Index management**: Ensure indexes are created for performance
3. **Content type validation**: Always validate `contentType` in services
4. **Migration path**: Provide clear migration for existing content

## Related Models

The following separate models complement the Content model:

- **KBVersion**: Article version history
- **KBComment**: Article comments and discussions
- **KBBookmark**: User bookmarks for quick access
- **KBAttachment**: File attachment metadata

These are separate collections but reference the Content document via `contentId` or `articleId`.

