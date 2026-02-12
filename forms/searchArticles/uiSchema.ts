/**
 * Search Articles Form UI Schema
 */

const SearchArticlesUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: true,
    showRefresh: false,
    showHelp: true,
    submitLabel: 'Search',
  },
  'ui:title': null,
  query: {
    'ui:widget': 'search',
    'ui:placeholder': 'Search articles...',
    'ui:options': {
      label: 'Search',
      helperText: 'Enter keywords to search for articles',
      autoFocus: true,
    },
  },
  filters: {
    'ui:options': {
      collapsible: true,
      collapsed: false,
      label: 'Filters',
    },
    kbId: {
      'ui:widget': 'select',
      'ui:options': {
        label: 'Knowledge Base',
        helperText: 'Limit search to a specific knowledge base',
        dataSource: {
          query: 'listKnowledgeBases',
          variables: {},
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
    tags: {
      'ui:widget': 'multiselect',
      'ui:options': {
        label: 'Tags',
        helperText: 'Filter by specific tags',
      },
    },
    lng: {
      'ui:widget': 'select',
      'ui:options': {
        label: 'Language',
        helperText: 'Filter by content language',
      },
    },
    status: {
      'ui:widget': 'select',
      'ui:options': {
        label: 'Status',
        helperText: 'Filter by publication status',
      },
    },
    categories: {
      'ui:widget': 'multiselect',
      'ui:options': {
        label: 'Categories',
        helperText: 'Filter by categories',
      },
    },
  },
  limit: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Results per page',
      options: [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '50', value: 50 },
        { label: '100', value: 100 },
      ],
    },
  },
  offset: {
    'ui:widget': 'hidden',
  },
};

export default SearchArticlesUISchema;

