FROM node:22
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm i prisma
COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build
CMD [ "npm", "start" ]