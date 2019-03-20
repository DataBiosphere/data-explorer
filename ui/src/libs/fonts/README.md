These font files are copied from saturn-ui **except for Montserrat-Medium.woff2**.

HistogramFacet uses Vega charts. Vega charts use TextMetrics to compute how many
pixels a string will take, before rendering the string element.

1.  Load font using FontFace API
1.  Vega calls TextMetrics on loaded font
1.  Vega renders string element with loaded font

If font is not preloaded in Step 1, the [chart renders incorrectly](https://github.com/vega/vega/issues/1671).

This repo and saturn-ui use tabular-nums. Unfortunately [it's not possible to
preload the tabular-nums variant](https://groups.google.com/a/chromium.org/forum/#!topic/layout-dev/GviE3lb2gSM).
So even though we preload Montserrat in Step 1, charts with numbers may be [rendered incorrectly](https://i.imgur.com/qFwHtPz.png).

So we create a custom font file with only tabular-nums numbers, and preload that.

Create custom font file:

- Navigate to https://www.fontsquirrel.com/tools/webfont-generator
- Upload `libs/fonts/Montserrat-Medium.woff2`. (Change "Custom Files" to "All Files".)
- Click on Expert, "No Subsetting", and "Tabular Numerals".
- Click on Download. Move `montserrat-medium-webfont.woff2` to
  `data-explorer/ui/src/libs/fonts/Montserrat-Medium.woff2`.
