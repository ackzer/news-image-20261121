[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/ackzer/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/ackzer/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

# The World in One Day

`main.ts` renders the locked Saturday 21 November 2026 copy from `news-data.json` as a single 1024 × 1024 RGB newspaper. The 16 illustrations and the numbered locator map are drawn procedurally. An original proportional bitmap face supplies slab-cut display capitals, matching-width bold, and compact regular body text at 9 px. The renderer uses only Node.js built-ins; it reads its data beside the script and writes only `entry.png` to `MAKEFUN_OUTPUT_DIR` (default `/output`). The output directory must already exist.

### Render and verify

With Node.js 22.18+, set `MAKEFUN_OUTPUT_DIR` to an existing writable directory outside the checkout. Run:

```text
node main.ts
node verify.ts <output-directory>/entry.png
```

The verification report goes to stdout. The checked-in proof of the full page is [`out/entry.png`](out/entry.png). The standalone font proof uses a one-pixel increase in tracking on its example sentence; that increase is not used on the story cards.

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON font-proof.ts <proof-directory>
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON verify-png.ts <proof-directory>/test-font.png 816 188
```

### Sentence fitting disclosures

The verifier checks which complete sentences were rendered and that the original source attribution is present. Stories 1–3 and 15 use their entire summaries. No attribution was moved to a kicker.

| No. | Story | Kept | Omitted |
| ---: | --- | --- | --- |
| 4 | Zelensky calls Putin an enemy and a killer | 1 | 2 |
| 5 | Tanker struck by projectile near Oman's Khasab | 1 | 2 |
| 6 | Gas pipeline blast kills four at Basra power plant | 1 | 2 |
| 7 | Jet lands safely in Davao after engine fire alert | 1 | 2 |
| 8 | China and Australia pledge AI and green trade ties | 1 | 2 |
| 9 | Japan reaffirms Taiwan policy after China snub | 1 | 2 |
| 10 | Bitcoin slides near $55,200 amid $2.5B liquidations | 1 | 2 |
| 11 | Verstappen warned after Las Vegas practice clash | 1 | 2 |
| 12 | KL Rahul hits 136 to put India in command in Test | 1 | 2 |
| 13 | Youth and labor protests sweep 25 European nations | 1 | 2 |
| 14 | African football leaders convene 54 nations in Abuja | 1 | 2 |
| 16 | BepiColombo enters Mercury orbit after 8-year trip | 1 | 2 |
