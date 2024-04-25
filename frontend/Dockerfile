# Use offical node.js image as a base
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the frontend files
COPY . .

# Build the app
RUN npm run build -- --configuration production

# Use lightweight nginx image as a base (needed for serving the app)
FROM nginx:alpine

# Copy the build files to the nginx directory
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]