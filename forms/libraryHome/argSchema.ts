const argsSchema = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      title: 'Category',
      description: 'The category to filter the library home view. [Optional]',
    },
    subcategory: {
      type: 'string',
      title: 'Subcategory',
      description: 'The subcategory to filter the library home view. [Optional]',
    },
    searchTerm: {
      type: 'string',
      title: 'Search Term',
      description: 'A search term to filter the library content. [Optional]',
    },
  },
};

export default argsSchema;