import schema from './schema';
import uiSchema from './uiSchema';
import argsSchema from './argSchema';
import modules from './modules';

const LibraryHomeForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.LibraryHome@1.0.0',
  name: 'LibraryHome',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Knowledge Library Home',
  description: `
    The main landing page for the Knowledge Base library.
    Features include quick search, recently viewed items,
    new content showcase, and popular categories.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  argsSchema,
  helpTopics: ['kb-library-home'],
  registerAsComponent: true,
  modules,
  widgetMap: [
    { componentFqn: 'kb.ContentListWidget@1.0.0', widget: 'ContentListWidget' },
    { componentFqn: 'kb.CategoryGridWidget@1.0.0', widget: 'CategoryGridWidget' },
  ],
};

export default LibraryHomeForm;

