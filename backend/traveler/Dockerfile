# Dockerfile for Node.js Backend Services
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
# Create uploads directory
RUN mkdir -p uploads

# Default port (can be overridden)
ENV PORT=8000
EXPOSE 8000

CMD ["npm", "start"]
