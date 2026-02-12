/**
 * Library Home Page UI Schema
 */

const LibraryHomeUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: false,
    showRefresh: true,
    showHelp: true,
    toolbarPosition: 'bottom',
    style: { 
      marginTop: '40px',
      marginLeft: 'auto', 
      marginRight: 'auto', 
      maxWidth: 1200
    },
  },
  'ui:title': 'Knowledge Library',
  'ui:field': 'GridLayout',
  'ui:grid-layout': [
    { quickSearch: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { searchFilters: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { searchResults: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { recentItems: { xs: 12, sm: 12, lg: 6, xl: 6 } },
    { newContent: { xs: 12, sm: 12, lg: 6, xl: 6 } },
    { popularCategories: { xs: 12, sm: 12, lg: 12, xl: 12 } },
  ],
  quickSearch: {
    'ui:widget': 'search',
    'ui:placeholder': 'Search articles, books, chapters...',
    'ui:options': {
      label: null,
      autoFocus: true,
      variant: 'outlined',
      fullWidth: true,
      size: 'large',
    },
  },
  searchFilters: {
    'ui:field': 'GridLayout',
    'ui:grid-layout': [
      { category: { xs: 12, sm: 6, md: 4, lg: 4, xl: 4 } },
      { subCategory: { xs: 12, sm: 6, md: 4, lg: 4, xl: 4 } },
      { contentTypes: { xs: 12, sm: 12, md: 4, lg: 4, xl: 4 } },
    ],
    category: {
      'ui:widget': 'SelectWidget',
      'ui:title': 'Category',
      'ui:options': {
        placeholder: 'Select Category',
        allowClear: true,
      },
    },
    subCategory: {
      'ui:widget': 'SelectWidget',
      'ui:title': 'Sub-Category',
      'ui:options': {
        placeholder: 'Select Sub-Category',
        allowClear: true,
      },
    },
    contentTypes: {            
      'ui:options': {
        placeholder: 'Select Content Types',
        allowClear: true,
      },
    },
  },
  searchResults: {    
    'ui:options': {
      title: 'Search Results',
      icon: 'search',
      emptyMessage: 'No results found',      
    },
  },  
  recentItems: {    
    'ui:options': {
      title: 'Recently Viewed',
      icon: 'history',
      emptyMessage: 'No recent items',
      showDate: true,
      dateField: 'lastViewed',
    },
  },
  newContent: {
    'ui:options': {
      title: 'New Content',
      icon: 'new_releases',
      emptyMessage: 'No new content',
      showAuthor: true,
      showDate: true,
      dateField: 'createdAt',
    },
  },
  popularCategories: {
    'ui:options': {
      title: 'Popular Categories',
      icon: 'category',
      columns: 4,
    },
  },
};

export default LibraryHomeUISchema;

