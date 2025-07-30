#!/bin/sh

APP_DIR="/app"

# If app doesn't exist, create it
if [ ! -f "$APP_DIR/angular.json" ]; then
  echo "No Angular project found. Creating..."
  ng new frontend --directory=./ --routing --style=scss --skip-git
else
  echo "Angular project already exists."
fi

npm install

# Continue with passed command (usually "ng serve")
exec "$@"