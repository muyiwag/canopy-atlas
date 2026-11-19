# Thinking Trees Canopy Atlas

Nigeria is the first edition. This repository contains a static city atlas and reusable tooling for publishing documented urban canopy estimates. City markers and field priorities are a proposed work programme. The public preview includes linked research layers, two credited reference photographs, and a downloadable field template.

## Run the atlas

```sh
python3 tools/package_source.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Select a city from the map or the buttons, or open a link such as http://localhost:8000/?city=kano. The site runs on any static host. For GitHub Pages, copy the contents of `dist` to the Pages branch or publish `dist` through a Pages workflow.

## Reproduce a canopy estimate

1. Version a fixed city footprint and an open-water exclusion. Use a local equal-area CRS, or define a suitable common equal-area projection before making comparisons. Record the source imagery, acquisitions and licence.
2. Derive a canopy mask at a locally calibrated height or from image classification. Inspect errors from buildings, shadows, low crowns and imagery dates. Store canopy as 1, observed non-canopy as 0, and missing coverage as NoData.
3. Install Rasterio in a dedicated Python environment. Supply a single-band mask raster in an equal-area projected CRS with metre units and a GeoJSON footprint already in the raster’s CRS. Blockwise sampling uses pixel centres. Use the same pixel grid and boundary for each observation year.
4. Run the summary. It reports area measured inside the grid, known cover among observed pixels, and a lower and upper bound for the accounted footprint when missing cells are all treated as non-canopy or canopy respectively. These bounds represent missingness, not a statistical confidence interval.

```sh
python3 -m pip install rasterio
python3 tools/summarize_canopy.py canopy-mask.tif city-land-area.geojson
```

Treat any city estimate as provisional until you check it with independently sampled observations and report uncertainty. See [the methods notes](docs/methods.md). The [imagery credits](docs/imagery.md) distinguish existing reference photographs from project flights.

The MIT licence covers original code. Basemap, external research data and imagery retain their own terms. Contribute through [issues](https://github.com/muyiwag/canopy-atlas/issues) or [pull requests](https://github.com/muyiwag/canopy-atlas/pulls). Report suspected canopy losses without publishing personal details or exact coordinates on private land.
