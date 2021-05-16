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

ARG SHORT_SHA
ARG PORT
ARG REDIS_URL

ENV SHORT_SHA=$SHORT_SHA
ENV REACT_APP_SHORT_SHA=$SHORT_SHA
ENV NODE_ENV=production

RUN yarn workspace server build

RUN yarn workspace client build

EXPOSE 3000

CMD ["yarn", "workspace", "server", "start"]
