import ViewArticleForm from '../viewArticle';
import SearchResultsForm from '../searchResults';

/**
 * Guards the knowledge-base form grid layouts.
 *
 * `ui:grid-layout` is the render list: a schema property the layout does not
 * name is not rendered (legacy `MaterialGridField` and, since
 * REACTORY-302016408/20261014/2327145804, the v5 object template both work this
 * way). Several view/search fields had widgets configured but no layout slot, so
 * they never appeared on either engine; these tests pin them into the layout and
 * state the invariant for future additions.
 */
describe('knowledge base form layouts', () => {
  const declaredProperties = (form: any): Set<string> => {
    const rows: Array<Record<string, unknown>> = form.uiSchema['ui:grid-layout'] as any;
    const declared = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => declared.add(key.split('.')[0])));
    return declared;
  };

  const boundWidgets = (form: any): string[] =>
    Object.entries((form.schema as any).properties as Record<string, any>)
      .filter(([name]) => {
        const fieldUi = form.uiSchema[name];
        const widget = fieldUi && typeof fieldUi === 'object' ? fieldUi['ui:widget'] : undefined;
        // A hidden field is intentionally not rendered, so it needs no slot.
        return typeof widget === 'string' && widget.length > 0 && widget !== 'hidden' && widget !== 'HiddenWidget';
      })
      .map(([name]) => name);

  describe('viewArticle', () => {
    it('declares the article-state metadata in the layout', () => {
      const declared = declaredProperties(ViewArticleForm);

      expect(declared).toContain('lng');
      expect(declared).toContain('status');
      expect(declared).toContain('version');
    });

    it('gives every widget-bound property a layout slot', () => {
      const declared = declaredProperties(ViewArticleForm);
      const missing = boundWidgets(ViewArticleForm).filter((name) => !declared.has(name));

      expect(missing).toEqual([]);
    });

    it('keeps the article id hidden rather than laid out', () => {
      // `uiSchema` is a union of schema/function shapes on the form type.
      expect((ViewArticleForm.uiSchema as any).id).toEqual({ 'ui:widget': 'hidden' });
      expect(declaredProperties(ViewArticleForm)).not.toContain('id');
    });
  });

  describe('searchResults', () => {
    it('declares the active-filters widget in the layout', () => {
      expect(declaredProperties(SearchResultsForm)).toContain('filters');
    });

    it('gives every widget-bound property a layout slot', () => {
      const declared = declaredProperties(SearchResultsForm);
      const missing = boundWidgets(SearchResultsForm).filter((name) => !declared.has(name));

      expect(missing).toEqual([]);
    });

    it('keeps the page-size limit hidden rather than laid out', () => {
      // `uiSchema` is a union of schema/function shapes on the form type.
      expect((SearchResultsForm.uiSchema as any).limit).toEqual({ 'ui:widget': 'hidden' });
      expect(declaredProperties(SearchResultsForm)).not.toContain('limit');
    });
  });
});
