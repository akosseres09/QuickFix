#!/bin/bash

source ./documentation/scripts/progress.sh
source ./documentation/scripts/directory-check.sh

check_directory

echo "Generating graph for layout modules..."

dirs=$(find "src/app/layouts" -maxdepth 1 -mindepth 1 -type d)
total=$(echo "$dirs" | wc -l)
count=0

progress_bar $count $total

for dir in $dirs; do
    name=$(basename "$dir")

    if [[ ! -d "./documentation/layouts/$name" ]]; then
        echo -e "\nCreating documentation directory for layout module: $name"
        mkdir -p "./documentation/layouts/$name"
    fi

    npx depcruise src --focus "^src/app/layouts/$name" --output-type dot | dot -T svg > "./documentation/layouts/${name}/${name}-dependency-graph.svg"
    ((count++))
    progress_bar $count $total
done

echo -e "\nAll layout module dependency graphs have been generated successfully."