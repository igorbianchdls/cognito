# Slide PPTX Export

The PPTX exporter renders `SlideDeckModel` into native PowerPoint objects through `pptxgenjs`.

## Editability Policy

- `Title`, `Subtitle`, `TextBox`, `Bullets`, and `Footer` export as editable text boxes.
- `Shape`, `Card`, and `Stat` export as editable PowerPoint shapes/text.
- `Image` and `Logo` export as PowerPoint images.
- `Table` exports as an editable table when `props.data` is present.
- `Chart` exports as a native editable chart when `props.data` is present.
- `Chart` and `Table` with only `dataQuery` export as editable placeholders until query hydration is added.
- Structural HTML is traversed as fallback. Arbitrary CSS is not considered a reliable editable PowerPoint contract.
- `PivotTable` has partial support and currently falls back instead of exporting a native pivot.

Run the smoke test with:

```bash
node scripts/artifacts/slides/export-pptx-smoke.mjs
```
