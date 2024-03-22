import { createNameId } from "mnemonic-id";
import fastJson from "fast-json-stringify";
// import parse from 'fast-json-parse'

import Datagram from "dgram";
import path from "path";
import { createReadStream, createWriteStream, WriteStream } from "fs";
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

const musicReadStream = createReadStream(
  path.join(import.meta.dirname, "./scarlet_fire.mp3"),
);

const writeStreams = new Map<string, WriteStream>();

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

  if (!writeStreams.has(from)) {
    console.log(`I am ${ourName}, I got from ${from}`);
    writeStreams.set(
      from,
      createWriteStream(
        path.join(import.meta.dirname, `$./${from}_scarlet_fire.raw`),
      ),
    );
  }

  const musicWriteStream = writeStreams.get(from);

  return (musicWriteStream as WriteStream).write(data);
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
      const packet = stringify({
        from: ourName,
        data: chunk.toString(),
      });

      serverSocket.send(
        packet,
        0,
        packet.length,
        ports.PEER_CLIENT_PORT,
        "224.0.0.1",
      );

      continue;
    }
  });
});

process.on("exit", async () => {
  serverSocket.close();
  clientSocket.close();

  await new Promise((resolve) => setTimeout(resolve, 500));
});
