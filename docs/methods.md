# Canopy, tree records and street shade

## Study boundaries and sources

Use [GHSL urban-centre footprints](https://human-settlement.emergency.copernicus.eu/ghs_ucdb_2024.php) as a starting point. Publish the final footprint, projection, epoch and water mask, and explain local revisions. Keep the comparison footprint fixed. Show city totals and small-area summaries with coverage and uncertainty. Administrative boundaries can be a separate reporting geography.

- [Nigeria tree canopy research](https://doi.org/10.1016/j.rsase.2026.102213) provides 30 m fractional canopy estimates for 2017, 2020 and 2024 from Alegbeleye and colleagues. [Map](https://ee-alegbeleyeokiki.projects.earthengine.app/view/tree-canopy-cover-in-nigeria) and [code](https://github.com/Okikiola-Michael/tree_canopy_cover_nigeria). Use as historical context and a cross-check at aggregated scales. Do not resample these rasters and present them as new high-resolution observations.
- [WRI/Meta CHMv2](https://registry.opendata.aws/dataforgood-fb-forestsv2/) provides historical estimates of canopy height at approximately 1 m. Read each tile’s acquisition date and calibrate a threshold on locally labelled examples. Match the relevant observation date when calculating apparent change.
- [Sentinel-2](https://dataspace.copernicus.eu/) and [Dynamic World](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1) flag candidates for field checks. Do not report tree-class probability as fractional canopy.
- [Global Mangrove Watch](https://www.eorc.jaxa.jp/ALOS/en/dataset/gmw_e.htm) is a separate habitat layer. Declare whether mangrove canopy is included in every published denominator.

## Field evidence

Use [QGIS](https://qgis.org/) with [QField](https://docs.qfield.org/) or another agreed offline survey tool. Give trained teams assigned segments and form IDs. Record evidence date, measurement conditions and accuracy. Use more specific taxonomic identifications only when the evidence supports them. Keep each tree's identifier stable over repeat visits and link replacement trees to planting positions. Publish only consented evidence, generalised where necessary.

Validate canopy with a stratified probability sample across the study boundary, including mapped canopy, sparse crowns, apparent non-canopy and areas where models disagree. Use dated reference imagery and independent review. Record omissions, false detections and missing observations. Document sample design and confidence intervals separately from map coverage.

For street shade, use an agreed afternoon observation window, surveyed routes and representative public waiting places. Record cloud cover, time and whether shade is provided by a tree, a building, both or neither. Report share of surveyed pedestrian route shaded and evidence dates. Keep project planting, original-tree survival and net canopy change as three separate results.

## Photography and processing

Use existing authorised imagery when available. For new aerial work, agree the footprint, permissions, deliverable licence and applicable [NCAA requirements](https://ncaa.gov.ng/documents/regulations/nig-cars-2023/part-21-remotely-piloted-aircraft-systems-rpas/) with the operator and site host. Retain georeferenced orthomosaics with acquisition metadata. Use [OpenDroneMap](https://docs.opendronemap.org/) for processing and an independently checked crown mask for canopy area. Label editorial photographs separately.

## Publication checklist

Every release includes versioned footprints and metrics, datasets with licence and attribution, a processing commit or script, reference sample design, error estimates and a coverage map. Use analysis-ready GeoTIFFs for rasters and GeoJSON or GeoPackage for public vectors. Mark missing observations explicitly.
