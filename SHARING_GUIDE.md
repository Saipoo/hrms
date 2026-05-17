# How to Share Your App (Docker Hub Method)

This guide shows how to **pre-build** your images so your friends don't need to build them from source. They will only need Docker and one file.

## Prerequisites
1.  Create a free account at [hub.docker.com](https://hub.docker.com/).
2.  Login in your terminal:
    ```bash
    docker login
    ```

## 1. Build and Push Images

Replace `your_username` with your actual Docker Hub username.

```bash
# 1. Build the images
docker compose build

# 2. Tag them for Docker Hub
docker tag crapcbmajor-frontend your_username/connectbook-frontend
docker tag crapcbmajor-backend your_username/connectbook-backend

# 3. Push them
docker push your_username/connectbook-frontend
docker push your_username/connectbook-backend
```

## 2. Prepare for Friends

Create a file named `docker-compose.prod.yml` (or just send them this content) with the **image** fields pointing to your pushed images.

**File Content (`docker-compose.prod.yml`):**

```yaml
version: '3.8'
services:
  frontend:
    image: your_username/connectbook-frontend  # <--- CHANGED
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: always

  backend:
    image: your_username/connectbook-backend   # <--- CHANGED
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/connectbook
      - NODE_ENV=production
      # Add your other secrets here or ask friends to create a .env file
    depends_on:
      - mongo
    restart: always

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: always

volumes:
  mongo-data:
```

## 3. What Your Friends Do

1.  Give them the `docker-compose.prod.yml` file.
2.  They run ONE command:
    ```bash
    docker compose -f docker-compose.prod.yml up -d
    ```

Docker will automatically download (pull) your pre-built images and start the app.
