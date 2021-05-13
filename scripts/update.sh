#!/bin/bash
echo "Pruning unused images"
docker image prune -a -f;

echo "Pulling latest"
docker-compose -f docker-compose.prod.yml pull; 

echo "Bringing down containers"
docker-compose -f docker-compose.prod.yml down --remove-orphans

echo "Relaunching"
docker-compose -f docker-compose.prod.yml up --detach;