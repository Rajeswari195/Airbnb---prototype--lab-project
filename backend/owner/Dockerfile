# Dockerfile for Node.js Backend Services
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
# Create uploads directory
RUN mkdir -p uploads

ENV PORT=8001
EXPOSE 8001

CMD ["npm", "start"]
