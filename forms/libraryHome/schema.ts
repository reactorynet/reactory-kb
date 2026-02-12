/**
 * Library Home Page Schema
 */

const ContentTypesSchema: Reactory.Schema.IArraySchema = {
  type: 'array',
  title: 'Content Types',
  description: 'Types of content to include in search',
  items: { 
    type: 'object', 
    title: 'Content Type',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    }
  },
  minLength: 0,
  uniqueItems: true,
};

const CategoryItemSchema: Reactory.Schema.IObjectSchema = { 
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    parent: { type: 'object', properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    }},
    children: {       
      type: 'array',
      items: { 
        type: 'object', 
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        }
      },
    },
  },
  required: ['id', 'name' ],
};

const AuthorSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    bio: { type: 'string' },
  },
  required: ['id', 'name' ],
};

const ContentItemSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    contentType: { type: 'string' },
    author: { 
      type: 'object', 
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      }
    },
    snippet: { type: 'string' },
    lastUpdated: { type: 'string', format: 'date-time' },
  },
};

const PopularCategoriesSchema: Reactory.Schema.IArraySchema = {
  type: 'array',
  title: 'Popular Categories',
  description: 'Most popular content categories',
  items: CategoryItemSchema,
  minLength: 0,
  maxLength: 10,
};

const SearchResultsSchema: Reactory.Schema.IArraySchema = {
  type: 'array',
  title: 'Search Results',
  description: 'Results from the last search',
  items: ContentItemSchema,
  minLength: 0,
  maxLength: 50,
};

const RecentItemsSchema: Reactory.Schema.IArraySchema = {
  type: 'array',
  title: 'Recently Viewed Items',
  description: 'Your last 5 viewed items',
  items: ContentItemSchema,
  minLength: 0,
  maxLength: 5,
}

const NewContentItemsSchema: Reactory.Schema.IArraySchema = {
  type: 'array',
  title: 'New Content Items',
  description: 'Recently added content items',
  items: ContentItemSchema,
  minLength: 0,
  maxLength: 20,
}

const LibraryHomeSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  properties: {
    header: {
      type: 'object',
      title: 'Header',
      description: 'Library Home Page Header',
      properties: {
        title: { type: 'string', title: 'Title' },
        subtitle: { type: 'string', title: 'Subtitle' },
        backgroundImage: { type: 'string', title: 'Background Image URL' },        
      },
    },
    statistics: {
      type: 'object',
      title: 'Library Statistics',
      description: 'Key statistics about the library',
      properties: {
        totalArticles: { type: 'number', title: 'Total Articles' },
        totalBooks: { type: 'number', title: 'Total Books' },
        totalChapters: { type: 'number', title: 'Total Chapters' },
        totalAuthors: { type: 'number', title: 'Total Authors' },
        totalMinutesRead: { type: 'number', title: 'Total Minutes Read' },
      },
    },
    quickSearch: {
      type: 'string',
      title: 'Quick Search',
      description: 'Search articles, books, and chapters',
    },
    searchFilters: {
      type: 'object',
      title: 'Search Filters',
      description: 'Filters applied to search results',
      properties: {
        category: {
          type: 'string',
          title: 'Category',
        },
        subCategory: {
          type: 'string',
          title: 'Sub-Category',
        },
        contentTypes: ContentTypesSchema,
      },
    },
    searchResults: SearchResultsSchema,    
    recentItems: RecentItemsSchema,
    newContent: NewContentItemsSchema,
    popularCategories: PopularCategoriesSchema,
  },
};

export default LibraryHomeSchema;

