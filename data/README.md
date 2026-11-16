# Data sources

This project uses Sentinel-2 Level-2A surface reflectance imagery
accessed through Google Earth Engine.

## Sentinel-2 imagery

- Collection: `COPERNICUS/S2_SR_HARMONIZED`
- Study period: 1 January–31 December 2020
- Earth Engine date filter: `2020-01-01` to `2021-01-01`, with the end date excluded
- Scene-level cloud filter: `CLOUDY_PIXEL_PERCENTAGE < 40`
- Images after filtering: 91
- MGRS tile: `52TCR`

## Study area

The rectangular study area is located in northeastern China
and covers approximately 30.27 km².

- West: 127.0174059098627°E
- East: 127.09328023847598°E
- South: 45.72428339205893°N
- North: 45.77052203673915°N

The area contains agricultural fields, water bodies, roads
and settlements.

## Pixel masking

The workflow excludes SCL classes 0, 1, 3, 8, 9, 10 and 11,
covering no-data pixels, saturated or defective pixels,
cloud shadows, clouds, cirrus and snow/ice.

Water is retained. Regional NDVI statistics therefore
represent the full study area rather than cropland alone.

## Data access

Raw Sentinel-2 imagery is not stored in this repository.
The script accesses the imagery directly through Google Earth Engine.

Dataset documentation:
https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
