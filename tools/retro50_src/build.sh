#!/bin/bash
cd "$(dirname "$0")"
cat r50_core.js r50_cars.js r50_cars1.js r50_cars2.js r50_cars3.js r50_cars4.js r50_trucks.js r50_vans.js r50_special.js r50_decals.js r50_wreck.js r50_end.js > retro50.js
node --check retro50.js && cp retro50.js ../../js/modern/retro50.js && echo built
