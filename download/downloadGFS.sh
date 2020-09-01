#!/bin/bash
createJSON () {
    URL=$1
    NAME=$2
    OUT=$(grib_dump -j ../demo/data/gribData/${NAME}.grib)
    curl "${URL}" -o ../demo/data/gribData/${NAME}.grib
    echo "${OUT}" > ../demo/data/jsonData/${NAME}.json
}

times=("00" "06" "12" "18")

U_GRD="var_UGRD=on"
V_GRD="var_VGRD=on"
TOZNE="var_TOZNE=on"

WIND_LEVEL="lev_10_m_above_ground=on"
OZONE_LEVEL="lev_entire_atmosphere=on&lev_entire_atmosphere_%5C%28considered_as_a_single_layer%5C%29=on"

REGION="subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90"

for x in 1 2 3 4 5 6 7 8
do
    DATE="$(date -v-${x}d +%Y%m%d)"
    for t in "${times[@]}"
    do
        windURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${t}z.pgrb2.0p25.f000&${WIND_LEVEL}&${REGION}&dir=%2Fgfs.${DATE}%2F${t}"
        ozoneURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${t}z.pgrb2.0p25.f000&all_lev=on&var_TOZNE=on&subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.${DATE}%2F${t}"

        createJSON "${windURL}&${U_GRD}" "u_wind_${x}_t${t}"
        createJSON "${windURL}&${V_GRD}" "v_wind_${x}_t${t}"
        createJSON "${ozoneURL}" "ozone_${x}_t${t}"
    done
done

node createPNG.js