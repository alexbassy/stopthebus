#!/bin/bash
echo "Pulling latest"
docker-compose -f docker-compose.prod.yml pull

echo "Bringing down containers"
docker-compose -f docker-compose.prod.yml down --remove-orphans

echo "Clearing volumes"
docker volume rm stopthebus_asset-volume

echo "Relaunching"
docker-compose -f docker-compose.prod.yml up --detach --force-recreate

echo "Pruning unused images"
docker image prune -a -f