#!/bin/bash
set -e

echo "Installing Node.js dependencies..."
npm ci

echo "Building Next.js application..."
npm run build

echo "Setup complete!"
