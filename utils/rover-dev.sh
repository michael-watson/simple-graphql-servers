#!/bin/bash

_term() { 
  kill "$MAIN_PID" 
}

trap _term SIGINT

set -eumo pipefail

pwd

rover dev -p 4000 --url http://localhost:9999/.netlify/functions/subgraph-address-enrichment --schema=api/schemas/address-enrichment.graphql --name subgraph-address-enrichment &
MAIN_PID=$! 

sleep 1
rover dev -p 4000 --url http://localhost:9999/.netlify/functions/subgraph-congress --schema=api/schemas/congress.graphql --name subgraph-congress &> out.log  &
sleep 1
rover dev -p 4000 --url http://localhost:9999/.netlify/functions/subgraph-daylight-times --schema=api/schemas/daylight-times.graphql --name subgraph-daylight-times &> out.log  &
sleep 1
rover dev -p 4000 --url http://localhost:9999/.netlify/functions/subgraph-ip-enrichment --schema=api/schemas/ip-enrichment.graphql --name subgraph-ip-enrichment &> out.log  &
sleep 1
rover dev -p 4000 --url http://localhost:9999/.netlify/functions/subgraph-weather --schema=api/schemas/weather.graphql --name subgraph-weather &> out.log  &
sleep 1

# Put main rover session job in the foreground
# We do this so when the terminal is quit by the user, rover runs standard cleanup
fg %1