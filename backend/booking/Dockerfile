# Dockerfile for Node.js Backend Services
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8003
EXPOSE 8003

CMD ["npm", "start"]
