for zfield in leaves flowers grasses
do
gdal_grid -zfield $zfield \
  -a invdist:power=3:smoothing=0.25:radius1=0.0:radius2=0.0:angle=0.0:max_points=6:min_points=0:nodata=0.0 \
  fall.geojson $zfield-idw.tif
gdalwarp -dstalpha \
  -srcnodata 0 -dstnodata 0 \
  -cutline mn/mn.shp \
  -crop_to_cutline \
  $zfield-idw.tif $zfield.tif
rm $zfield-idw.tif
done
