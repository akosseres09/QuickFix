#!/bin/bash

source ./documentation/scripts/progress.sh
source ./documentation/scripts/directory-check.sh

check_directory

echo "Generating graph for common modules..."

dirs=$(find "src/app/auth" -maxdepth 1 -mindepth 1 -type d)
total=$(echo "$dirs" | wc -l)
count=0

progress_bar $count $total

for dir in $dirs; do
    name=$(basename "$dir")

    if [[ ! -d "./documentation/auth/$name" ]]; then
        echo -e "\nCreating documentation directory for auth module: $name"
        mkdir -p "./documentation/auth/$name"
    fi

    npx depcruise src --focus "^src/app/auth/$name" --output-type dot | dot -T svg > "./documentation/auth/${name}/${name}-dependency-graph.svg"
    ((count++))
    progress_bar $count $total
done

echo -e "\nAll auth module dependency graphs have been generated successfully."