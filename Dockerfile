FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    pnpm prisma generate

RUN pnpm build

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
