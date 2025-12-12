# Use an official Node.js image as the base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Environment variables from your .env file
ARG PORT
ARG GMAIL_USER
ARG GMAIL_PASS
ARG JWT_SECRET
ARG REDIS_HOST
ARG REDIS_PORT
ARG REDIS_USERNAME
ARG REDIS_PASSWORD
ARG MONGODB_URI
ARG BACKEND_AUTH_CORS_ORIGIN

ENV PORT=$PORT
ENV GMAIL_USER=$GMAIL_USER
ENV GMAIL_PASS=$GMAIL_PASS
ENV JWT_SECRET=$JWT_SECRET
ENV REDIS_HOST=$REDIS_HOST
ENV REDIS_PORT=$REDIS_PORT
ENV REDIS_USERNAME=$REDIS_USERNAME
ENV REDIS_PASSWORD=$REDIS_PASSWORD
ENV MONGODB_URI=$MONGODB_URI
ENV BACKEND_AUTH_CORS_ORIGIN=$BACKEND_AUTH_CORS_ORIGIN

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
