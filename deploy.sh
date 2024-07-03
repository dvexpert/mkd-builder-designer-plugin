#!/bin/bash

package_name=$(npm pkg get name | sed 's/"//g')
package_version=$(npm pkg get version | sed 's/"//g')

Green='\033[0;32m'
echo -e "${Green}Building ${package_name} version ${package_version}\n"

rm -rf build/*

export VITE_NODE_ENVIRONMENT="production"
export VITE_BUILDING_FOR_DEMO="false"
export VITE_OUTPUT_DIR="build"

yarn build

mv build/assets/css/style.css build/designer.css

build_file_name="${package_name}_v${package_version}.zip"
if [ -f $build_file_name ]; then
    echo -e "Removing old build file \"$build_file_name\"\n"
    rm $build_file_name
    sleep 0.5s
fi
rm -rf build.zip
cd build/

zip -r "../$build_file_name" . -x "assets/*" "image/*"

echo -e "\n${Green}Build zip created succesfully. \"$build_file_name\"\n"

# Move to Mkd builder local setup
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/@vendor-*
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/AttributesOverlay-*
# rm -rf /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/mkd-plugin.es.js-*

# cp -Rf build/*.js /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/js/
# cp -Rf build/designer.css /home/teq001/projects/mkd/mkd-builder/wp-content/plugins/mkd-builder/public/css/designer.css
