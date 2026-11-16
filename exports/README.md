# Exported data

## ndvi_annual_median_2020.tif

Annual per-pixel median NDVI calculated from masked
Sentinel-2 observations acquired during 2020.

- Coordinate reference system: EPSG:32652, WGS 84 / UTM zone 52N
- Export pixel size: 10 m
- Values: numerical NDVI, not rendered RGB colours

## ndvi_monthly_summary_2020.csv

Regional statistics calculated from monthly median NDVI composites.

Columns:

- `month`: month number
- `date`: month in YYYY-MM format
- `mean_ndvi`: regional mean of the monthly median NDVI composite
- `image_count`: number of input images for that month before pixel masking

Regional means were calculated at a 30 m sampling scale
in EPSG:32652. Missing NDVI values are not replaced with zero.

Monthly image counts do not represent the number of valid
observations at every pixel.
