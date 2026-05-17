# Docker Commands

## Run Project (Single Command)
```bash
docker compose up --build
```
This builds the images and starts the containers. Use `-d` to run in detached mode (background).

## Stop Project
```bash
docker compose down
```

## View Logs
```bash
docker compose logs -f
```

## Restart Project
```bash
docker compose restart
```

## Rebuild Images Forcefully
```bash
docker compose build --no-cache
```
