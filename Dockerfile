# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Force cache bust on every deploy (Easy Panel: pass --build-arg CACHEBUST=$(date +%s))
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Setup production environment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Railway will inject PORT environment variable)
EXPOSE 4721

# Start the application
CMD ["node", "dist/main"]
