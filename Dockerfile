FROM node:12-alpine

WORKDIR /usr/src/app
EXPOSE 3000

ADD package.json yarn.lock /usr/src/app/
RUN yarn install --production

ADD . /usr/src/app

USER node
CMD ["yarn", "run", "new-anime"]

