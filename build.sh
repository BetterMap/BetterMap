#!/bin/bash

cd "$(dirname "$0")"

rm -rf out/

mkdir out
mkdir out/BetterMap

rsync -av --exclude-from=".gitignore"\
    --exclude="*.git*"\
    --exclude="build.sh"\
    --exclude="README.md"\
    * out/BetterMap/

cd out/
zip -r BetterMap.zip BetterMap/
rm -rf BetterMap