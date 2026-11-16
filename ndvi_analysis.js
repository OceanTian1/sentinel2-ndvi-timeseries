var roi = ee.Geometry.Rectangle(
  [
    127.0174059098627,
    45.72428339205893,
    127.09328023847598,
    45.77052203673915
  ],
  null,
  false
);

var startDate = '2020-01-01';
var endDate = '2021-01-01';
var analysisCRS = 'EPSG:32652';

Map.centerObject(roi, 12);

// Select Sentinel-2 surface reflectance images.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(roi)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40));

// Mask invalid pixels, cloud shadows, clouds and snow.
function calculateNDVI(img) {
  var scl = img.select('SCL');

  var mask = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  return img.updateMask(mask)
    .normalizedDifference(['B8', 'B4'])
    .rename('NDVI')
    .copyProperties(img, ['system:time_start']);
}

var ndviCollection = s2.map(calculateNDVI);

// Annual median NDVI.
var annualNDVI = ndviCollection
  .median()
  .clip(roi);

Map.addLayer(
  annualNDVI,
  {
    min: -0.2,
    max: 0.9,
    palette: [
      '#2166ac',
      '#f5f5dc',
      '#d9ef8b',
      '#66bd63',
      '#006837'
    ]
  },
  '2020 median NDVI'
);

var outline = ee.Image()
  .byte()
  .paint(
    ee.FeatureCollection([ee.Feature(roi)]),
    1,
    2
  );

Map.addLayer(
  outline,
  {palette: ['#ff0000']},
  'Study area boundary'
);

// Calculate the regional mean of each monthly median composite.
var monthlyResults = ee.FeatureCollection(
  ee.List.sequence(1, 12).map(function(month) {
    var monthStart = ee.Date.fromYMD(2020, month, 1);
    var monthEnd = monthStart.advance(1, 'month');

    var monthlyImages = ndviCollection.filterDate(
      monthStart,
      monthEnd
    );

    var emptyNDVI = ee.Image.constant(0)
      .rename('NDVI')
      .selfMask();

    var monthlyMedian = ee.Image(
      ee.Algorithms.If(
        monthlyImages.size().gt(0),
        monthlyImages.median(),
        emptyNDVI
      )
    );

    var meanNDVI = monthlyMedian.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: roi,
      crs: analysisCRS,
      scale: 30,
      maxPixels: 1e8
    }).get('NDVI');

    return ee.Feature(null, {
      month: month,
      date: monthStart.format('YYYY-MM'),
      mean_ndvi: meanNDVI,
      image_count: monthlyImages.size()
    });
  })
).sort('month');

var chart = ui.Chart.feature.byFeature(
  monthlyResults,
  'month',
  ['mean_ndvi']
)
  .setChartType('LineChart')
  .setOptions({
    title: 'Monthly NDVI variation (2020)',
    hAxis: {
      title: 'Month',
      ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    vAxis: {
      title: 'Regional mean of monthly median NDVI'
    },
    pointSize: 5,
    lineWidth: 2,
    interpolateNulls: false,
    colors: ['#238b45'],
    legend: {position: 'none'}
  });

print('Filtered Sentinel-2 image count:', s2.size());
print(chart);

// Export numerical NDVI values.
Export.image.toDrive({
  image: annualNDVI.toFloat(),
  description: 'NDVI_2020_annual_median',
  folder: 'GEE_Exports',
  fileNamePrefix: 'ndvi_annual_median_2020',
  region: roi,
  crs: analysisCRS,
  scale: 10,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Export the monthly statistics.
Export.table.toDrive({
  collection: monthlyResults,
  description: 'NDVI_2020_monthly_summary',
  folder: 'GEE_Exports',
  fileNamePrefix: 'ndvi_monthly_summary_2020',
  fileFormat: 'CSV',
  selectors: [
    'month',
    'date',
    'mean_ndvi',
    'image_count'
  ]
});

// Summarise seasonal variation using valid monthly results.
var validMonths = monthlyResults.filter(
  ee.Filter.notNull(['mean_ndvi'])
);

var peakMonth = ee.Feature(
  validMonths.sort('mean_ndvi', false).first()
);

var lowestMonth = ee.Feature(
  validMonths.sort('mean_ndvi', true).first()
);

var ndviRange = ee.Number(peakMonth.get('mean_ndvi'))
  .subtract(ee.Number(lowestMonth.get('mean_ndvi')));

print('Monthly NDVI summary:', ee.Dictionary({
  valid_month_count: validMonths.size(),
  peak_month: peakMonth.get('date'),
  peak_ndvi: peakMonth.get('mean_ndvi'),
  lowest_month: lowestMonth.get('date'),
  lowest_ndvi: lowestMonth.get('mean_ndvi'),
  seasonal_ndvi_range: ndviRange
}));
