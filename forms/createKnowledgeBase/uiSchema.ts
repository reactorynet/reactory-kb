/**
 * Create Knowledge Base Form UI Schema
 */

const CreateKnowledgeBaseUISchema: Reactory.Schema.IFormUISchema = {
  'ui:form': {
    showSubmit: true,
    showRefresh: false,
    showHelp: true,
    submitLabel: 'Create Knowledge Base',
  },
  'ui:title': 'Create Knowledge Base',
  title: {
    'ui:widget': 'text',
    'ui:placeholder': 'Enter knowledge base title',
    'ui:options': {
      label: 'Title',
      helperText: 'A clear, descriptive name for your knowledge base',
    },
  },
  description: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Describe the purpose of this knowledge base',
    'ui:options': {
      rows: 4,
      label: 'Description',
      helperText: 'Explain what this knowledge base is about and what content it will contain',
    },
  },
  lng: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Default Language',
      helperText: 'Select the primary language for content in this knowledge base',
    },
  },
  visibility: {
    'ui:widget': 'select',
    'ui:options': {
      label: 'Visibility',
      helperText: 'Control who can view and access this knowledge base',
    },
  },
  tags: {
    'ui:widget': 'tags',
    'ui:options': {
      label: 'Tags',
      helperText: 'Add tags to help organize and discover this knowledge base',
      placeholder: 'Add tag and press Enter',
    },
  },
};

export default CreateKnowledgeBaseUISchema;

