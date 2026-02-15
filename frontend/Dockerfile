# Frontend Dockerfile
FROM node:20 AS build

WORKDIR /app/frontend

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the app (Vite will pick up VITE_API_URL from env)
RUN yarn build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose frontend port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
