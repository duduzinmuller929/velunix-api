FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm tsx

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml  ./

RUN  pnpm install --frozen-lockfile

COPY . .

EXPOSE 8000

CMD ["tsx", "src/server.ts"]