# syntax=docker/dockerfile:1.4

FROM node:21 AS client

# Create app directory
WORKDIR /usr/src/app

COPY . .

CMD [ "npm", "run", "client" ]

FROM node:21 AS server

# Create app directory
WORKDIR /usr/src/app

COPY . .

CMD [ "npm", "run", "server" ]

FROM node:21 AS cnc

# Create app directory
WORKDIR /usr/src/app

COPY . .

CMD [ "npm", "run", "cnc" ]
