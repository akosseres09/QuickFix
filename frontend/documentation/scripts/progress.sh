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