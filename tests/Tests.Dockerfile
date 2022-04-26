FROM mcr.microsoft.com/playwright:v1.21.0-focal

WORKDIR /work

ENV BASE_URL=https://blue.dontwasteyourweeks.com/
ENV CI=true

COPY . .

CMD npx playwright test 
