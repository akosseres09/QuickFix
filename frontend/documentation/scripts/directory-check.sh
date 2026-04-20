#!/bin/bash

check_directory() {
    currentDir=$(pwd)
    if [[ ! "$currentDir" =~ QuickFix/frontend ]]; then
        echo "Error: Please run this script from the 'QuickFix/frontend' directory."
        exit 1
    fi
}