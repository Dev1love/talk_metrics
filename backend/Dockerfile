FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Note: For development mode, we need dev dependencies (like nodemon)
# The container will be used for both prod and dev, so install all deps
RUN npm ci

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]