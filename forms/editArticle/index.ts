import schema from './schema';
import uiSchema from './uiSchema';

const EditArticleForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.EditArticleForm@1.0.0',
  name: 'EditArticleForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Edit Article',
  description: `
    Form for editing existing knowledge articles.
    Provides a rich Markdown editor with auto-save functionality,
    version history tracking, and support for multi-language translations.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-edit-article', 'kb-markdown-guide', 'kb-version-control'],
  registerAsComponent: true,
  widgetMap: [
    { componentFqn: 'kb.LocalizedContentEditorWidget@1.0.0', widget: 'LocalizedContentEditorWidget' },
  ],
};

export default EditArticleForm;

