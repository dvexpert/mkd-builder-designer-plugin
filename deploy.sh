#!/bin/bash

rm -rf build/*

export VITE_NODE_ENVIRONMENT="production"
export VITE_BUILDING_FOR_DEMO="false"
export VITE_OUTPUT_DIR="build"

yarn build

mv build/assets/css/style.css build/designer.css

rm -rf build.zip
cd build/
DATA=$(date +'%Y_%m_%d_%H_%m_%S')
zip -r ../build_$DATA.zip . -x "assets/*" "image/*"


# Move to Mkd builder local setup
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/@vendor-*
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/AttributesOverlay-*
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/mkd-plugin.es.js-*

# cp -Rf build/*.js /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/
# cp -Rf build/assets/css/style.css /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/css/designer.css

