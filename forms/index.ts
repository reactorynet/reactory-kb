/**
 * Knowledge Base Form Definitions
 * 
 * Form schemas for KB module
 */

import Reactory from '@reactory/reactory-core';

/**
 * Create Knowledge Base Form
 */
const CreateKnowledgeBaseForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.CreateKnowledgeBaseForm@1.0.0',
  name: 'CreateKnowledgeBaseForm',
  nameSpace: 'kb',
  version: '1.0.0',
  uiFramework: 'material',
  uiSchema: {
    title: {
      'ui:widget': 'text',
      'ui:placeholder': 'Enter knowledge base title',
    },
    description: {
      'ui:widget': 'textarea',
      'ui:placeholder': 'Describe the purpose of this knowledge base',
      'ui:options': {
        rows: 4,
      },
    },
    lng: {
      'ui:widget': 'select',
    },
    visibility: {
      'ui:widget': 'select',
    },
    tags: {
      'ui:widget': 'tags',
    },
  },
  schema: {
    type: 'object',
    required: ['title', 'lng'],
    properties: {
      title: {
        type: 'string',
        title: 'Title',
        minLength: 3,
        maxLength: 200,
      },
      description: {
        type: 'string',
        title: 'Description',
        maxLength: 1000,
      },
      lng: {
        type: 'string',
        title: 'Default Language',
        enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
        enumNames: ['English', 'Français', 'Español', 'Português', 'Deutsch', 'Italiano', '日本語', '中文'],
        default: 'en',
      },
      visibility: {
        type: 'string',
        title: 'Visibility',
        enum: ['private', 'public', 'shared', 'organization'],
        enumNames: ['Private', 'Public', 'Shared', 'Organization'],
        default: 'private',
      },
      tags: {
        type: 'array',
        title: 'Tags',
        items: {
          type: 'string',
        },
      },
    },
  },
  registerAsComponent: false,
};

/**
 * Create Article Form
 */
const CreateArticleForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.CreateArticleForm@1.0.0',
  name: 'CreateArticleForm',
  nameSpace: 'kb',
  version: '1.0.0',
  uiFramework: 'material',
  uiSchema: {
    title: {
      'ui:widget': 'text',
      'ui:placeholder': 'Enter article title',
    },
    content: {
      'ui:widget': 'markdown',
      'ui:options': {
        toolbar: true,
        preview: true,
      },
    },
    description: {
      'ui:widget': 'textarea',
      'ui:placeholder': 'Brief summary of the article',
      'ui:options': {
        rows: 3,
      },
    },
    lng: {
      'ui:widget': 'select',
    },
    tags: {
      'ui:widget': 'tags',
    },
    categories: {
      'ui:widget': 'multiselect',
    },
  },
  schema: {
    type: 'object',
    required: ['title', 'content', 'lng'],
    properties: {
      title: {
        type: 'string',
        title: 'Title',
        minLength: 3,
        maxLength: 300,
      },
      content: {
        type: 'string',
        title: 'Content',
        minLength: 100,
      },
      description: {
        type: 'string',
        title: 'Summary',
        maxLength: 500,
      },
      lng: {
        type: 'string',
        title: 'Language',
        enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
        enumNames: ['English', 'Français', 'Español', 'Português', 'Deutsch', 'Italiano', '日本語', '中文'],
        default: 'en',
      },
      tags: {
        type: 'array',
        title: 'Tags',
        items: {
          type: 'string',
        },
      },
      categories: {
        type: 'array',
        title: 'Categories',
        items: {
          type: 'string',
        },
      },
    },
  },
  registerAsComponent: false,
};

/**
 * Search Articles Form
 */
const SearchArticlesForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.SearchArticlesForm@1.0.0',
  name: 'SearchArticlesForm',
  nameSpace: 'kb',
  version: '1.0.0',
  uiFramework: 'material',
  uiSchema: {
    query: {
      'ui:widget': 'search',
      'ui:placeholder': 'Search articles...',
    },
    filters: {
      tags: {
        'ui:widget': 'multiselect',
      },
      lng: {
        'ui:widget': 'select',
      },
      status: {
        'ui:widget': 'select',
      },
    },
  },
  schema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        title: 'Search Query',
        minLength: 2,
      },
      filters: {
        type: 'object',
        title: 'Filters',
        properties: {
          tags: {
            type: 'array',
            title: 'Tags',
            items: {
              type: 'string',
            },
          },
          lng: {
            type: 'string',
            title: 'Language',
            enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
          },
          status: {
            type: 'string',
            title: 'Status',
            enum: ['draft', 'under_review', 'published', 'archived'],
            enumNames: ['Draft', 'Under Review', 'Published', 'Archived'],
          },
        },
      },
      limit: {
        type: 'number',
        title: 'Results Limit',
        default: 20,
        minimum: 1,
        maximum: 100,
      },
    },
  },
  registerAsComponent: false,
};

const forms = [
  CreateKnowledgeBaseForm,
  CreateArticleForm,
  SearchArticlesForm,
];

export default forms;
export {
  CreateKnowledgeBaseForm,
  CreateArticleForm,
  SearchArticlesForm,
};
