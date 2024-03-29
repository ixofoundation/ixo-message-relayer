FROM --platform=linux/amd64 node:18

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --pure-lockfile

COPY . .

RUN npx prisma generate
RUN yarn build

CMD ["yarn","start:prod"]
