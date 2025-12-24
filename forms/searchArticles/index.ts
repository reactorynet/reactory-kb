import schema from './schema';
import uiSchema from './uiSchema';

const SearchArticlesForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.SearchArticlesForm@1.0.0',
  name: 'SearchArticlesForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Search Articles',
  description: `
    Form for searching knowledge articles.
    Provides full-text search with advanced filtering options including
    tags, language, status, categories, and knowledge base.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-search-articles'],
  registerAsComponent: false,
};

export default SearchArticlesForm;

