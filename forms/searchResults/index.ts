import schema from './schema';
import uiSchema from './uiSchema';

const SearchResultsForm: Reactory.Forms.IReactoryForm = {
  id: 'kb.SearchResultsForm@1.0.0',
  name: 'SearchResultsForm',
  nameSpace: 'kb',
  version: '1.0.0',
  title: 'Search Results',
  description: `
    Form for displaying knowledge base search results.
    Features faceted search, filtering, sorting, and pagination.
    Results include content type indicators, excerpts, and relevance scores.
  `,
  uiFramework: 'material',
  uiSupport: ['material'],
  schema,
  uiSchema,
  uiResources: [],
  helpTopics: ['kb-search-results', 'kb-faceted-search'],
  registerAsComponent: true,
  widgetMap: [
    { componentFqn: 'kb.SearchResultsListWidget@1.0.0', widget: 'SearchResultsListWidget' },
    { componentFqn: 'kb.FacetedSearchWidget@1.0.0', widget: 'FacetedSearchWidget' },
    { componentFqn: 'kb.ActiveFiltersWidget@1.0.0', widget: 'ActiveFiltersWidget' },
  ],
};

export default SearchResultsForm;

