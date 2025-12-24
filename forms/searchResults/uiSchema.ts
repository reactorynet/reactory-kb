/**
 * Search Results Form UI Schema
 */

const SearchResultsUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: false,
    showRefresh: true,
    showHelp: true,
    toolbarPosition: 'top',
  },
  'ui:title': null,
  'ui:field': 'GridLayout',
  'ui:grid-layout': [
    { query: { xs: 12, sm: 9, lg: 10, xl: 10 } },
    { sortBy: { xs: 12, sm: 3, lg: 2, xl: 2 } },
    { total: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { facets: { xs: 12, sm: 12, lg: 3, xl: 3 } },
    { results: { xs: 12, sm: 12, lg: 9, xl: 9 } },
    { page: { xs: 12, sm: 12, lg: 12, xl: 12 } },
  ],
  query: {
    'ui:widget': 'search',
    'ui:placeholder': 'Refine your search...',
    'ui:options': {
      label: null,
      variant: 'outlined',
    },
  },
  results: {
    'ui:widget': 'SearchResultsListWidget',
    'ui:options': {
      label: null,
      showRelevanceScore: true,
      showContentType: true,
      showExcerpt: true,
      excerptLength: 200,
      highlightMatches: true,
      groupBy: null, // or 'contentType', 'category', etc.
    },
  },
  total: {
    'ui:widget': 'LabelWidget',
    'ui:options': {
      template: '${total} results found',
      variant: 'body2',
      color: 'textSecondary',
    },
  },
  page: {
    'ui:widget': 'PaginationWidget',
    'ui:options': {
      showFirstButton: true,
      showLastButton: true,
      boundaryCount: 1,
      siblingCount: 2,
    },
  },
  limit: {
    'ui:widget': 'hidden',
  },
  facets: {
    'ui:widget': 'FacetedSearchWidget',
    'ui:options': {
      label: 'Refine Results',
      collapsible: true,
      showCounts: true,
      contentTypes: {
        label: 'Content Type',
        icon: 'article',
      },
      tags: {
        label: 'Tags',
        icon: 'local_offer',
        maxDisplay: 10,
      },
      languages: {
        label: 'Language',
        icon: 'language',
      },
      authors: {
        label: 'Authors',
        icon: 'person',
        maxDisplay: 10,
      },
    },
  },
  filters: {
    'ui:widget': 'ActiveFiltersWidget',
    'ui:options': {
      label: 'Active Filters',
      showClearAll: true,
      removable: true,
    },
  },
  sortBy: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Sort',
      variant: 'outlined',
      size: 'small',
    },
  },
};

export default SearchResultsUISchema;

