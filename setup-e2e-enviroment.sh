#!/bin/bash
set -x
cat ./verdaccio/config/config.yaml
docker compose up -d
docker exec -it verdaccio cat /verdaccio/conf/config.yaml
npx json-server --port 8080 -w json-server-data/db.json -m json-server-data/file.js  -q &
