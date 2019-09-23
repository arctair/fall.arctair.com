# $1 geojson in
# $2 cutline in
# $3 zfield
# $4 tif out
tmp="$(mktemp /tmp/XXXXXX.tif)"
gdal_grid -zfield $3 \
  -a invdist:power=3:smoothing=0.25:radius1=0.0:radius2=0.0:angle=0.0:max_points=6:min_points=0:nodata=0.0 \
  $1 $tmp
gdalwarp -dstalpha \
  -srcnodata 0 -dstnodata 0 \
  -cutline $2 \
  -crop_to_cutline \
  $tmp $4
rm $tmp