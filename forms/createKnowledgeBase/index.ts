import schema from './schema';
import uiSchema from './uiSchema';

const CreateKnowledgeBaseForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.CreateKnowledgeBaseForm@1.0.0',
  name: 'CreateKnowledgeBaseForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Create Knowledge Base',
  description: `
    Form for creating a new knowledge base in the Reactory KB module.
    This form allows users to define a new knowledge base with a title,
    description, default language, visibility settings, and tags.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-create-knowledge-base'],
  registerAsComponent: false,
};

export default CreateKnowledgeBaseForm;

