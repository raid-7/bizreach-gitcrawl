#!/bin/sh

set -e
mkdir -p dist
wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F6.18.0/pmd-bin-6.18.0.zip -O dist/pmd.zip
cd dist
unzip pmd.zip
