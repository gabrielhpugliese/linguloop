# Stage 1: Build the static export
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Build the Next.js static export
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the static export from the builder stage to nginx html directory
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
