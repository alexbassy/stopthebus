FROM node:15-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY .eslintrc .
COPY .prettierrc .

COPY client ./client
COPY server ./server
COPY shared ./shared

RUN yarn --frozen-lockfile

WORKDIR /usr/src/app/server/
RUN yarn build

WORKDIR /usr/src/app/client/
RUN yarn build

ARG PORT
ARG REDIS_URL

EXPOSE 4000

CMD ["yarn", "workspace", "server", "start"]
