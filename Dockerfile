FROM arm64v8/node:15-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY .eslintrc .
COPY .prettierrc .

RUN mkdir client
RUN mkdir server
RUN mkdir shared

COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json

RUN yarn --frozen-lockfile

COPY ./client/. client/
COPY ./server/. server/
COPY ./shared/. shared/

ARG PORT
ARG REDIS_URL

EXPOSE 3000

CMD ["yarn", "workspace", "server", "start"]
