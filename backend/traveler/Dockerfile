# Dockerfile for Node.js Backend Services
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
# Copy uploads if they exist (mostly for owner/property services)
COPY uploads ./uploads

# Default port (can be overridden)
ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
