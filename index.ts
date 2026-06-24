import Reactory from '@reactorynet/reactory-core';
import clis from './cli';
import resolvers from './graphql/resolvers';
import types from './graphql/types';
import workflows from './workflows';
import forms from './forms';
import models from './models';
import services from './services';
import routes from './routes';
import middleware from './middleware';
import { KB_MACROS, KnowledgeBasePersona } from './ai';

const ReactoryKnowledgeBaseModule: Reactory.Server.IReactoryModule = {
  id: 'reactory-kb',
  nameSpace: 'kb',
  version: '1.0.0',
  name: 'ReactoryKnowledgeBase',
  dependencies: [
    { id: 'reactory-core', version: '1.0.0' }
  ],
  priority: 100,
  graphDefinitions: {
    Resolvers: resolvers,
    Types: [...types],
    Directives: []
  },
  workflows: [...workflows],
  forms: [...forms],
  services: [...services],
  translations: {},
  models: [...models],
  clientPlugins: [],
  serverPlugins: [],
  cli: [...clis],
  description: 'Reactory Knowledge Base Module. Provides comprehensive knowledge management capabilities for users and AI agents.',
  grpc: null,
  passportProviders: [],
  pdfs: [],
  middleware,
  routes,
  reactor: {
    providers: [],
    tools: [],
    mcp: [],
    agents: [],
    macros: KB_MACROS,
  },
};

export default ReactoryKnowledgeBaseModule;
