#!/bin/bash
echo "Logging into ECR"
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 197098829537.dkr.ecr.eu-central-1.amazonaws.com
echo "Building new image"
REGISTRY=197098829537.dkr.ecr.eu-central-1.amazonaws.com docker-compose -f docker-compose.prod.yml build
echo "Bringing down containers"
docker-compose -f docker-compse.prod.yml down --remove-orphans
echo "Relaunching"
docker-compose -f docker-compse.prod.yml up --detach