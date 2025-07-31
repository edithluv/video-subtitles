FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (works with or without lock file)
RUN npm cache clean --force
RUN npm install --omit=dev

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create temp directory
RUN mkdir -p temp

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt --break-system-packages

EXPOSE 3000

CMD ["npm", "start"]
