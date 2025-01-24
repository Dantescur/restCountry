# Use a Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
