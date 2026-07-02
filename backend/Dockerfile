# Build from backend directory: docker build -t classroom-inspection-backend .
#
# Run the container:
# docker run -d -p 8091:4000 \
#   -e DATABASE_URL=postgresql://postgres:5116@host.docker.internal:5432/ClassroomInspection \
#   -e PORT=4000 \
#   -e HOURLY_RATE=50 \
#   classroom-inspection-backend
#
# API available at: http://localhost:8091/api/
# Note: host.docker.internal routes to the Mac host where PostgreSQL is running
FROM node:22-alpine

WORKDIR /app

# Create stub for the file:.. dependency in package.json
RUN echo '{"name":"classroom-inspection","version":"1.0.0"}' > /package.json

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
