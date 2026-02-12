/**
 * Knowledge Base Forms
 * 
 * All form definitions for the KB module
 */

import CreateKnowledgeBaseForm from './createKnowledgeBase';
import CreateArticleForm from './createArticle';
import SearchArticlesForm from './searchArticles';
import LibraryHomeForm from './libraryHome';
import ViewArticleForm from './viewArticle';
import EditArticleForm from './editArticle';
import SearchResultsForm from './searchResults';

const forms: Reactory.Forms.IReactoryForm[] = [
  // Knowledge Base Management
  CreateKnowledgeBaseForm,
  
  // Article Management
  CreateArticleForm,
  EditArticleForm,
  ViewArticleForm,
  
  // Library & Navigation
  LibraryHomeForm,
  SearchArticlesForm,
  SearchResultsForm,
];

export default forms;

export {
  CreateKnowledgeBaseForm,
  CreateArticleForm,
  EditArticleForm,
  ViewArticleForm,
  SearchArticlesForm,
  SearchResultsForm,
  LibraryHomeForm,
};
