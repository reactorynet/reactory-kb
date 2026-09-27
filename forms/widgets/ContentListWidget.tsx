interface ReactoryWindow extends Window { 
  reactory?: {
    api?: Reactory.Client.IReactoryApi;
  }
}

const ContentListWidget: React.FC<unknown & {
 reactory: Reactory.Client.IReactoryApi;
}> = (props) => {
  const { reactory } = props;
  const { React } = reactory.getComponents<any>(['react.React']); 
  return (<div>
      Content List Component
    </div>
  );
}

//@ts-ignore
const Definition: Reactory.IReactoryComponentDefinition = {
  name: 'ContentListWidget',
  nameSpace: 'kb',
  version: '1.0.0',
  component: ContentListWidget,
  roles: ['USER', 'ADMIN'],
};

//@ts-ignore
const _window = window as ReactoryWindow;
if (_window.reactory?.api) {  
  _window.reactory.api.registerComponent(Definition.nameSpace,
    Definition.name,
    Definition.version,
    ContentListWidget,
    ['knowledge-base', 'content', 'list'],
    Definition.roles,
    true,
    [],
    'widget');
  //@ts-ignore
  window.reactory.api.amq.raiseReactoryPluginEvent('loaded', { 
    componentFqn: `${Definition.nameSpace}.${Definition.name}@${Definition.version}`, 
    component: ContentListWidget 
  });
} else {
  console.warn('Reactory API not available, cannot register ContentListWidget component');
}