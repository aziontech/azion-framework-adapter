#!/bin/bash
docker-compose up -d
npx json-server --port 8080 -w json-server-data/db.json -m json-server-data/file.js  -q &