FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies including devDependencies based on user request to support development mode if needed, 
# but for production optimization, usually we'd do `npm ci --only=production`. 
# However, user asked for "support development mode if possible" but also "optimized production-ready".
# I will stick to a standard production build but ensure it can run.
# Actually, let's just do `npm ci` to be safe with any build scripts, but user requirement "install dependencies efficiently".
RUN npm ci

COPY . .

# Create non-root user
# Node image already has a 'node' user
USER node

EXPOSE 5000

CMD ["npm", "start"]
