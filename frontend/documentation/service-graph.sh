#!/bin/bash

progress_bar() {
    local progress=$1
    local total=$2
    local width=50

    local percent=$((progress * 100 / total))
    local filled=$((progress * width / total))
    local empty=$((width - filled))

    printf "\r["
    printf "%0.s#" $(seq 1 $filled)
    printf "%0.s-" $(seq 1 $empty)
    printf "] %d%% (%d/%d)" "$percent" "$progress" "$total"
}

currentDir=$(pwd)
if [[ ! "$currentDir" =~ QuickFix/frontend ]]; then
    echo "Error: Please run this script from the 'QuickFix/frontend' directory."
    exit 1
fi

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
