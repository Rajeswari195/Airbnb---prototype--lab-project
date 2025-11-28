# Dockerfile for Node.js Backend Services
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8002
EXPOSE 8002

CMD ["npm", "start"]
