import schema from './schema';
import uiSchema from './uiSchema';

const ViewArticleForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.ViewArticleForm@1.0.0',
  name: 'ViewArticleForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'View Article',
  description: `
    Form for viewing knowledge articles.
    Displays article content in a reader-friendly format with
    metadata, categories, tags, attachments, and comments.
    Includes actions for editing, bookmarking, and sharing.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-view-article'],
  registerAsComponent: true,
  widgetMap: [
    { componentFqn: 'kb.MarkdownViewerWidget@1.0.0', widget: 'MarkdownViewerWidget' },
    { componentFqn: 'kb.AttachmentListWidget@1.0.0', widget: 'AttachmentListWidget' },
    { componentFqn: 'kb.CommentsWidget@1.0.0', widget: 'CommentsWidget' },
    { componentFqn: 'kb.LanguageSelectorWidget@1.0.0', widget: 'LanguageSelectorWidget' },
  ],
};

export default ViewArticleForm;

