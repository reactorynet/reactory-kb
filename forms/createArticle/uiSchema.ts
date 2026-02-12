/**
 * Create Article Form UI Schema
 */

const CreateArticleUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: true,
    showRefresh: false,
    showHelp: true,
    submitLabel: 'Create Article',
  },
  'ui:title': 'Create Article',
  kbId: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Knowledge Base',
      helperText: 'Select the knowledge base for this article',
      dataSource: {
        query: 'listKnowledgeBases',
        variables: {},
        labelField: 'title',
        valueField: 'id',
      },
    },
  },
  title: {
    'ui:widget': 'text',
    'ui:placeholder': 'Enter article title',
    'ui:options': {
      label: 'Title',
      helperText: 'A clear, descriptive title for your article',
    },
  },
  content: {
    'ui:widget': 'markdown',
    'ui:options': {
      toolbar: true,
      preview: true,
      label: 'Content',
      helperText: 'Write your article content using Markdown formatting',
      minHeight: '400px',
    },
  },
  description: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Brief summary of the article',
    'ui:options': {
      rows: 3,
      label: 'Summary',
      helperText: 'A short summary that will appear in search results and article listings',
    },
  },
  lng: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Language',
      helperText: 'The language of this article content',
    },
  },
  tags: {
    'ui:widget': 'tags',
    'ui:options': {
      label: 'Tags',
      helperText: 'Add tags to help users find this article',
      placeholder: 'Add tag and press Enter',
    },
  },
  categories: {
    'ui:widget': 'multiselect',
    'ui:options': {
      label: 'Categories',
      helperText: 'Select one or more categories for this article',
      dataSource: {
        query: 'getKBCategories',
        variables: { kbId: '${kbId}' },
        labelField: 'name',
        valueField: 'id',
      },
    },
  },
};

export default CreateArticleUISchema;

