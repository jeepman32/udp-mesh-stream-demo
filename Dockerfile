# syntax=docker/dockerfile:1.4

FROM debian:12 AS development

RUN apt update -yq
RUN apt install curl -yq
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
  apt install -y nodejs \
  build-essential && \
  node --version && \
  npm --version

RUN apt install gnupg -yq
RUN apt install python3 -yq
RUN apt install python3-pyaudio -yq
RUN apt install pulseaudio -yq
RUN apt install socat -yq
RUN apt install alsa-utils -yq
RUN apt clean -y

COPY package.json /usr/src/app/package.json
COPY pnpm-lock.yaml /usr/src/app/pnpm-lock.yaml
COPY . .
RUN chmod +x ./run.sh

CMD ./run.sh
