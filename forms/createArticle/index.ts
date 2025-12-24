import schema from './schema';
import uiSchema from './uiSchema';

const CreateArticleForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.CreateArticleForm@1.0.0',
  name: 'CreateArticleForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Create Article',
  description: `
    Form for creating a new knowledge article.
    This form provides a rich Markdown editor for writing article content,
    along with fields for metadata like title, summary, categories, and tags.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-create-article', 'kb-markdown-guide'],
  registerAsComponent: false,
};

export default CreateArticleForm;

