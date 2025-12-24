import Reactory from '@reactory/reactory-core';
import { fileAsString } from '@reactory/server-core/utils/io';


export const modules: Reactory.Forms.IReactoryFormModule[] = [ 
 {
  compilerOptions: {},
  id: 'kb.CategoryGridWidget@1.0.0',
  src: fileAsString(require.resolve('@reactory/server-modules/reactory-kb/forms/widgets/CategoryGridWidget.tsx')),
  compiler: 'rollup',
  fileType: 'tsx'
 },
 {
  compilerOptions: {},
  id: 'kb.ContentListWidget@1.0.0',
  src: fileAsString(require.resolve('@reactory/server-modules/reactory-kb/forms/widgets/ContentListWidget.tsx')),
  compiler: 'rollup',
  fileType: 'tsx'
 }
];

export default modules;