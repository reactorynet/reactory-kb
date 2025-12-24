/**
 * Edit Article Form UI Schema
 */

const EditArticleUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: true,
    showRefresh: false,
    showHelp: true,
    submitLabel: 'Save Changes',
    customActions: [
      { id: 'preview', label: 'Preview', icon: 'visibility' },
      { id: 'viewHistory', label: 'Version History', icon: 'history' },
      { id: 'cancel', label: 'Cancel', icon: 'close', variant: 'outlined' },
    ],
  },
  'ui:title': 'Edit Article',
  'ui:field': 'GridLayout',
  'ui:grid-layout': [
    { id: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { title: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { description: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { content: { xs: 12, sm: 12, lg: 8, xl: 9 } },
    { lng: { xs: 12, sm: 6, lg: 4, xl: 3 } },
    { status: { xs: 12, sm: 6, lg: 4, xl: 3 } },
    { tags: { xs: 12, sm: 12, lg: 6, xl: 6 } },
    { categories: { xs: 12, sm: 12, lg: 6, xl: 6 } },
    { changeSummary: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { localizedContent: { xs: 12, sm: 12, lg: 12, xl: 12 } },
  ],
  id: {
    'ui:widget': 'hidden',
  },
  title: {
    'ui:widget': 'text',
    'ui:placeholder': 'Enter article title',
    'ui:options': {
      label: 'Title',
      helperText: 'A clear, descriptive title for your article',
      autoFocus: true,
    },
  },
  content: {
    'ui:widget': 'markdown',
    'ui:options': {
      toolbar: true,
      preview: true,
      label: 'Content',
      helperText: 'Edit your article content using Markdown formatting',
      minHeight: '500px',
      showWordCount: true,
      showAutoSave: true,
    },
  },
  description: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Brief summary of the article',
    'ui:options': {
      rows: 3,
      label: 'Summary',
      helperText: 'A short summary that will appear in search results',
    },
  },
  lng: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Language',
      helperText: 'The language of this article content',
    },
  },
  status: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Status',
      helperText: 'Set the publication status',
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
      helperText: 'Select one or more categories',
      dataSource: {
        query: 'getKBCategories',
        variables: {},
        labelField: 'name',
        valueField: 'id',
      },
    },
  },
  changeSummary: {
    'ui:widget': 'text',
    'ui:placeholder': 'Describe the changes made in this version',
    'ui:options': {
      label: 'Change Summary',
      helperText: 'Brief description of what was changed (for version history)',
    },
  },
  localizedContent: {
    'ui:widget': 'LocalizedContentEditorWidget',
    'ui:options': {
      label: 'Translations',
      helperText: 'Add or edit translations of this article',
      collapsible: true,
      collapsed: true,
    },
  },
};

export default EditArticleUISchema;

