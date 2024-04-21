# Use offical node.js image as a base
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY frontend/package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the files
COPY frontend/ .

# Build the app
RUN npm run build -- --configuration production

# Use lightweight nginx image as a base (needed for serving the app)
FROM nginx:alpine

# Copy the build files to the nginx directory
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]