# syntax=docker/dockerfile:1
# Yi & Jia Qi —— 单容器：Bun 服务同时提供前端页面、/api 和照片。
# 数据（SQLite + 照片）都在 /data，部署时务必挂一个持久化卷到 /data。

ARG BUN_VERSION=1.4.5

FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:${BUN_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    STATIC_DIR=/app/dist
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p /data && chown -R bun:bun /data
USER bun
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["bun", "server/index.ts"]
