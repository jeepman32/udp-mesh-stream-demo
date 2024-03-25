# Readme/Notes

A simple program to find the limits of data transmission by UDP broadcasts at low bitrates. It consists of one server and up to 64 clients. The server will wait three minutes for each Docker replica to finish starting, and will then broadcast up to 64 times at 16kbps, to simulate up to 64 broadcasters and up to 64 clients. The clients then write the received buffer to disk.

The result of the tests was a system with an AMD 6800U could support up to 64 broadcasters and clients, with ~80% CPU utilisation.

## Prerequisites

- Ensure Node is installed at LTS version
- Install `pnpm` locally or globally using `npm i -g pnpm`
- Run `pnpm i`
- Start the madness with `docker compose up`
- Benchmark your rig by increasing the `replicas` in `docker-compose.yml`
