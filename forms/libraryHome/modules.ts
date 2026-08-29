import Reactory from '@reactorynet/reactory-core';
import { fileAsString } from '@reactory/server-core/utils/io';
import path from 'path';

export const modules: Reactory.Forms.IReactoryFormModule[] = [ 
 {
  compilerOptions: {},
  id: 'kb.CategoryGridWidget@1.0.0',
  src: fileAsString(path.resolve(__dirname, '../widgets/CategoryGridWidget.tsx')),
  compiler: 'rollup',
  fileType: 'tsx'
 },
 {
  compilerOptions: {},
  id: 'kb.ContentListWidget@1.0.0',
  src: fileAsString(path.resolve(__dirname, '../widgets/ContentListWidget.tsx')),
  compiler: 'rollup',
  fileType: 'tsx'
 }
];

export default modules;