FROM node:15-alpine AS fe-build
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . ./

# Build the client
RUN yarn build

# Build server 
RUN yarn tsc --esModuleInterop --outDir srv src/api/index.ts

ENV PORT=3000
EXPOSE 3000

CMD ["node", "./srv/api/index.js"]
