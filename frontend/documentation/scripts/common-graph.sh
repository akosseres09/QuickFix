#!/bin/bash

source ./documentation/scripts/progress.sh
source ./documentation/scripts/directory-check.sh

check_directory

echo "Generating graph for common modules..."

dirs=$(find "src/app/common" -maxdepth 1 -mindepth 1 -type d)
total=$(echo "$dirs" | wc -l)
count=0

progress_bar $count $total

for dir in $dirs; do
    name=$(basename "$dir")

    if [[ ! -d "./documentation/common/$name" ]]; then
        echo -e "\nCreating documentation directory for common module: $name"
        mkdir -p "./documentation/common/$name"
    fi

    npx depcruise src --focus "^src/app/common/$name" --output-type dot | dot -T svg > "./documentation/common/${name}/${name}-dependency-graph.svg"
    ((count++))
    progress_bar $count $total
done

echo -e "\nAll common module dependency graphs have been generated successfully."
