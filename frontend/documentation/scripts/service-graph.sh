#!/bin/bash
source ./documentation/scripts/progress.sh
source ./documentation/scripts/directory-check.sh

check_directory

echo "Generating dependency graphs for all services in 'src/app/shared/services'..."

dirs=$(find "src/app/shared/services" -maxdepth 1 -mindepth 1 -type d)
total=$(echo "$dirs" | wc -l)
count=0

progress_bar $count $total

for dir in $dirs; do
    name=$(basename "$dir")

    if [[ ! -d "./documentation/services/$name" ]]; then
        echo -e "\nCreating documentation directory for service: $name"
        mkdir -p "./documentation/services/$name"
    fi

    npx depcruise src --focus "^src/app/shared/services/$name" --output-type dot | dot -T svg > "./documentation/services/${name}/${name}-dependency-graph.svg"
    ((count++))
    progress_bar $count $total
done

echo -e "\nAll service dependency graphs have been generated successfully."
