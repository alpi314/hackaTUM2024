# Use Node.js as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy application files
COPY app .

# Install dependencies
RUN npm install

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
