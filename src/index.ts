import { createNameId } from "mnemonic-id";
import fastJson from "fast-json-stringify";
// import parse from 'fast-json-parse'
import SimpleUdpStream from "simple-udp-stream";

import Datagram from "dgram";
import path from "path";
import { createReadStream, createWriteStream } from "fs";
import { ports } from "./constants";

interface Message {
  from: string;
  data: Buffer;
}

const stringify = fastJson({
  type: "object",
  properties: {
    from: {
      type: "string",
    },
    data: {
      type: "string",
    },
  },
});

await new Promise((resolve) => setTimeout(resolve, 500));

const ourName = createNameId();
const serverSocket = Datagram.createSocket({ type: "udp4" });
const clientSocket = Datagram.createSocket({ type: "udp4" });

const musicWriteStream = createWriteStream(
  path.join(import.meta.dirname, "/scarlett_fire.raw"),
);

const musicReadStream = createReadStream(
  path.join(import.meta.dirname, "./scarlet_fire.wav"),
);

clientSocket.on("listening", () => {
  clientSocket.setBroadcast(true);
  clientSocket.setMulticastTTL(128);
  clientSocket.addMembership("224.0.0.1");
});

clientSocket.on("error", (error) => {
  throw error;
});

// Write the received buffer into the engine
clientSocket.on("message", (message) => {
  const { from, data } = JSON.parse(message.toString()) as Message;

  // Ignore broadcasts from ourselves
  if (process.env.DOCKER !== "true" && from === ourName) {
    return;
  }

  musicWriteStream.write(data);
});

clientSocket.bind(ports.PEER_CLIENT_PORT);
serverSocket.bind(() => {
  serverSocket.setBroadcast(true);
  serverSocket.setMulticastTTL(128);

  serverSocket.on("error", (error) => {
    throw error;
  });

  musicReadStream.on("readable", () => {
    const chunkBytes = 1;
    let chunk;

    while (null !== (chunk = musicReadStream.read(chunkBytes))) {
      serverSocket.send(
        JSON.stringify({
          from: ourName,
          data: chunk,
        } satisfies Message),
        0,
        chunk.length,
        ports.PEER_SERVER_PORT,
        "224.0.0.1",
      );
    }
  });
});

process.on("exit", async () => {
  serverSocket.close();
  clientSocket.close();

  await new Promise((resolve) => setTimeout(resolve, 500));
});
