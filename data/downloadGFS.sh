#!/bin/bash

t1="t00"
t2="t06"
t3="t12"
t4="t18"

times=("00" "06" "12" "18")

# for x in 0 1 2 3 4 5 6 
# do
#     day=$((26-x)) 
#     t1="t00"
#     t2="t06"
#     t3="t12"
#     t4="t18"

#     waveURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_gwes.pl?file=gwes00.glo_30m.${t1}z.grib2&lev_surface=on&var_HTSGW=on&subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgwes.202008${day}"
#     curl "${waveURL}" -o /users/william/desktop/weatheranim/gribDL/wave${day}_${t1}.grib
#     W_OUT=$(grib_dump -j ./gribDL/wave${day}_${t1}.grib)
#     echo "$W_OUT" > ./data/wave${day}_${t1}.json

#     waveURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_gwes.pl?file=gwes00.glo_30m.${t2}z.grib2&lev_surface=on&var_HTSGW=on&subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgwes.202008${day}"
#     curl "${waveURL}" -o /users/william/desktop/weatheranim/gribDL/wave${day}_${t2}.grib
#     W_OUT=$(grib_dump -j ./gribDL/wave${day}_${t2}.grib)
#     echo "$W_OUT" > ./data/wave${day}_${t2}.json

#     waveURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_gwes.pl?file=gwes00.glo_30m.${t3}z.grib2&lev_surface=on&var_HTSGW=on&subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgwes.202008${day}"
#     curl "${waveURL}" -o /users/william/desktop/weatheranim/gribDL/wave${day}_${t3}.grib
#     W_OUT=$(grib_dump -j ./gribDL/wave${day}_${t3}.grib)
#     echo "$W_OUT" > ./data/wave${day}_${t3}.json

#     waveURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_gwes.pl?file=gwes00.glo_30m.${t4}z.grib2&lev_surface=on&var_HTSGW=on&subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgwes.202008${day}"
#     curl "${waveURL}" -o /users/william/desktop/weatheranim/gribDL/wave${day}_${t4}.grib
#     W_OUT=$(grib_dump -j ./gribDL/wave${day}_${t4}.grib)
#     echo "$W_OUT" > ./data/wave${day}_${t4}.json
# done

createJSON () {
    URL=$1
    NAME=$2
    OUT=$(grib_dump -j ../demo/data/gribData/${NAME}.grib)
    curl "${URL}" -o ../demo/data/gribData/${NAME}.grib
    echo "${OUT}" > ../demo/data/jsonData/${NAME}.json
}

U_GRD="var_UGRD=on"
V_GRD="var_VGRD=on"
LEVEL="lev_10_m_above_ground=on"
REGION="subregion=&leftlon=0&rightlon=360&toplat=90&bottomlat=-90"

for x in 1 2 3 4 5 6 7 8
do
    DATE="$(date -v-${x}d +%Y%m%d)"
    for t in "${times[@]}"
    do
        windURL="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${t}z.pgrb2.0p25.f000&${LEVEL}&${REGION}&dir=%2Fgfs.${DATE}%2F${t}"
        createJSON "${windURL}&${U_GRD}" "u_wind_${x}_t${t}"
        createJSON "${windURL}&${V_GRD}" "v_wind_${x}_t${t}"
    done
done

node createPNG.js
