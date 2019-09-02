FROM node:10-buster

WORKDIR /usr/src/app
EXPOSE 3000

ADD package.json package-lock.json /usr/src/app/
RUN npm i --production --no-progress

ADD . /usr/src/app

USER node
CMD ["node", "./new-anime.js"]

