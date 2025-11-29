# frontend/Dockerfile
# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
# Accept build arguments
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_AGENT_BASE

# Set them as environment variables during build
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_AGENT_BASE=$REACT_APP_AGENT_BASE
ENV REACT_APP_TRAVELER_API=$REACT_APP_API_BASE_URL
ENV REACT_APP_OWNER_API=$REACT_APP_API_BASE_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# React Router support: redirect 404s to index.html
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
