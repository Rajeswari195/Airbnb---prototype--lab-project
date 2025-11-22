# backend/owner/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY uploads ./uploads

ENV PORT=8001

EXPOSE 8001

CMD ["npm", "start"]


