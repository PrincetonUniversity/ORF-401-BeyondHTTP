# Test image: lint, format, type checks, unit tests and Chromium end-to-end tests.
# The Playwright base image version must match @playwright/test in package.json.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

ENV CI=true
WORKDIR /lab/web

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# The unit tests compare the shipped des_code.csv with the Java server's copy.
COPY --from=lab5_server des_code.csv /lab/Lab5_Server/des_code.csv

RUN useradd --create-home tester && chown -R tester /lab
USER tester

CMD ["npm", "test"]
