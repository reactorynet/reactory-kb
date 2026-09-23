
interface ReactoryWindow extends Window { 
  reactory?: {
    api?: Reactory.Client.IReactoryApi;
  }
}

const CategoryGridWidget: React.FC<unknown & {
 reactory: Reactory.Client.IReactoryApi;
}> = (props) => {
  const { reactory } = props;
  const { React } = reactory.getComponents<any>(['react.React']);
  return (<div>
      CategoryGridWidget Component
    </div>
  );
}

//@ts-ignore
const Definition: Reactory.IReactoryComponentDefinition = {
  name: 'CategoryGridWidget',
  nameSpace: 'kb',
  version: '1.0.0',
  component: CategoryGridWidget,
  roles: ['USER', 'ADMIN'],
};

const _window = window as ReactoryWindow;
if (_window.reactory?.api) {  
  _window.reactory.api.registerComponent(Definition.nameSpace,
    Definition.name,
    Definition.version,
    CategoryGridWidget,
    ['knowledge-base', 'category', 'grid'],
    Definition.roles,
    true,
    [],
    'widget');
  //@ts-ignore
  window.reactory.api.amq.raiseReactoryPluginEvent('loaded', { 
    componentFqn: `${Definition.nameSpace}.${Definition.name}@${Definition.version}`, 
    component: CategoryGridWidget 
  });
} else {
  console.warn('Reactory API not available, cannot register CategoryGridWidget component');
}