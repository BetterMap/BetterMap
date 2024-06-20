#!/bin/bash

cd "$(dirname "$0")"
mkdir out
cd ..
zip -r BetterMap/out/BetterMap.zip BetterMap/\
    -x BetterMap/*.git* BetterMap/build.sh