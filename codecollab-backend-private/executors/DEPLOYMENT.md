# CodeCollab Executor Deployment Guide

This guide explains how to deploy the 4 code execution containers (Python, Java, C++, Node.js) separately.

## 1. Prerequisites

- **Docker** and **Docker Compose** installed.
- **Node.js** needed for local development (optional, since runners are inside Docker).
- **Redis** running (optional, for future scalability).

## 2. Directory Structure

Each language has its own folder in `codecollab-backend/executors/` containing:

- `Dockerfile`: Defines the environment (compiler + runner).
- `runner.js`: The HTTP server execution logic.
- `package.json`: Dependencies for the runner.

## 3. Building Images

You can build each image locally:

```bash
# Python
docker build -t executor-python ./codecollab-backend/executors/python

# Java
docker build -t executor-java ./codecollab-backend/executors/java

# C++
docker build -t executor-cpp ./codecollab-backend/executors/cpp

# Node.js
docker build -t executor-node ./codecollab-backend/executors/node
```

## 4. Running Containers

Run each container on port 5000 (mapped to different host ports if running manually, or use internal network).

### Using Docker Compose (Recommended)

Our `docker-compose.yml` handles this automatically. Just run:

```bash
docker-compose up --build
```

This will start:

- `executor-python` (Internal Port 5000)
- `executor-java` (Internal Port 5000)
- `executor-cpp` (Internal Port 5000)
- `executor-node` (Internal Port 5000)

### Manual Run

If you need to run them manually (e.g. for testing individually):

```bash
docker run -p 5001:5000 executor-python
docker run -p 5002:5000 executor-java
docker run -p 5003:5000 executor-cpp
docker run -p 5004:5000 executor-node
```

## 5. API Usage

Each executor exposes a simple HTTP API:

**POST /execute**

```json
{
  "code": "print('Hello World')",
  "input": "stdin input here (optional)"
}
```

**Response:**

```json
{
  "status": "COMPLETED", // COMPLETED, FAILED, TIMEOUT, COMPILATION_ERROR
  "output": "Hello World\n",
  "error": "",
  "exitCode": 0,
  "executionTime": 42
}
```

## 6. Security Note

These runners are currently **unsupect to code injection** if malicious code is run (e.g. `rm -rf /`).
For production:

- Run containers with `--network none` or minimal privileges.
- Use a read-only filesystem except for a specific `/tmp` directory.
- Use a dedicated sandbox solution (like gVisor or Firecracker) if high security is required.
