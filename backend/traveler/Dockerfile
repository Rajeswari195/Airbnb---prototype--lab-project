# backend/traveler/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source + uploads
COPY src ./src
COPY uploads ./uploads

ENV PORT=8000

EXPOSE 8000

CMD ["npm", "start"]


