[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/ackzer/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/ackzer/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

# The World in One Day

The font proof for the Saturday 21 November 2026 edition uses an original proportional bitmap face: slab-cut display capitals for the date, matching-width bold for headlines and labels, and regular for 9 px body text. The proof opens up body tracking by one pixel; compact tracking is available for narrow measures. Each filled cell is drawn as a rectangle, and the raster is encoded directly as an RGB PNG using only Node.js built-ins.

With Node.js 22.18+ and an existing output directory outside the checkout:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON font-proof.ts <proof-directory>
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON verify-png.ts <proof-directory>/test-font.png 816 188
```
