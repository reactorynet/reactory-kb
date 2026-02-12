/**
 * View Article Form UI Schema
 */

const ViewArticleUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: false,
    showRefresh: true,
    showHelp: true,
    toolbarPosition: 'top',
    toolbarStyle: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    customActions: [
      { id: 'edit', label: 'Edit', icon: 'edit', roles: ['USER', 'ADMIN'] },
      { id: 'bookmark', label: 'Bookmark', icon: 'bookmark_border' },
      { id: 'share', label: 'Share', icon: 'share' },
      { id: 'download', label: 'Download', icon: 'download' },
    ],
  },
  'ui:title': null,
  'ui:field': 'GridLayout',
  'ui:grid-layout': [
    { title: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { author: { xs: 6, sm: 6, lg: 4, xl: 3 } },
    { createdAt: { xs: 6, sm: 6, lg: 4, xl: 3 } },
    { updatedAt: { xs: 6, sm: 6, lg: 4, xl: 3 } },
    { viewCount: { xs: 6, sm: 6, lg: 4, xl: 3 } },
    { description: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { localizedContent: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { content: { xs: 12, sm: 12, lg: 8, xl: 9 } },
    { tags: { xs: 12, sm: 12, lg: 4, xl: 3 } },
    { categories: { xs: 12, sm: 12, lg: 4, xl: 3 } },
    { attachments: { xs: 12, sm: 12, lg: 12, xl: 12 } },
    { comments: { xs: 12, sm: 12, lg: 12, xl: 12 } },
  ],
  id: {
    'ui:widget': 'hidden',
  },
  title: {
    'ui:widget': 'HeadingWidget',
    'ui:options': {
      variant: 'h3',
      component: 'h1',
    },
  },
  content: {
    'ui:widget': 'MarkdownViewerWidget',
    'ui:options': {
      label: null,
      showTableOfContents: true,
      showCopyButton: true,
    },
  },
  description: {
    'ui:widget': 'LabelWidget',
    'ui:options': {
      variant: 'subtitle1',
      color: 'textSecondary',
    },
  },
  author: {
    'ui:widget': 'UserAvatarWidget',
    'ui:options': {
      label: 'Author',
      showName: true,
      showEmail: false,
    },
  },
  lng: {
    'ui:widget': 'LabelWidget',
    'ui:options': {
      label: 'Language',
      icon: 'language',
    },
  },
  tags: {
    'ui:widget': 'ChipArrayWidget',
    'ui:options': {
      label: 'Tags',
      icon: 'local_offer',
      clickable: true,
    },
  },
  categories: {
    'ui:widget': 'ChipArrayWidget',
    'ui:options': {
      label: 'Categories',
      icon: 'category',
      clickable: true,
      labelField: 'name',
    },
  },
  status: {
    'ui:widget': 'BadgeWidget',
    'ui:options': {
      label: 'Status',
    },
  },
  version: {
    'ui:widget': 'LabelWidget',
    'ui:options': {
      label: 'Version',
      icon: 'history',
    },
  },
  viewCount: {
    'ui:widget': 'LabelWidget',
    'ui:options': {
      label: 'Views',
      icon: 'visibility',
    },
  },
  createdAt: {
    'ui:widget': 'DateTimeWidget',
    'ui:options': {
      label: 'Created',
      format: 'relative',
    },
  },
  updatedAt: {
    'ui:widget': 'DateTimeWidget',
    'ui:options': {
      label: 'Last Updated',
      format: 'relative',
    },
  },
  attachments: {
    'ui:widget': 'AttachmentListWidget',
    'ui:options': {
      label: 'Attachments',
      icon: 'attach_file',
      showSize: true,
      downloadable: true,
    },
  },
  comments: {
    'ui:widget': 'CommentsWidget',
    'ui:options': {
      label: 'Comments',
      allowReplies: true,
      allowEdit: true,
      showTimestamp: true,
    },
  },
  localizedContent: {
    'ui:widget': 'LanguageSelectorWidget',
    'ui:options': {
      label: 'Available in',
      icon: 'translate',
      showPublishedOnly: true,
    },
  },
};

export default ViewArticleUISchema;

