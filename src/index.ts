import { createNameId } from "mnemonic-id";
import fastJson from "fast-json-stringify";
// import parse from 'fast-json-parse'
import { AudioIO, getDevices } from "naudiodon-neo";

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

console.log(getDevices());

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

const audioEngine = AudioIO({
  outOptions: {
    channelCount: 2,
    // sampleFormat: 1,
    // sampleRate: 16,
    // highwaterMark: 64,
    framesPerBuffer: 1,
    deviceId: -1,
    closeOnError: false,
  },
  inOptions: {
    channelCount: 2,
    // sampleFormat: 1,
    // sampleRate: 16,
    // highwaterMark: 64,
    framesPerBuffer: 1,
    deviceId: -1,
    closeOnError: false,
  },
});

clientSocket.on("listening", () => {
  clientSocket.setBroadcast(true);
  clientSocket.setMulticastTTL(128);
  clientSocket.addMembership("224.0.0.1");
  audioEngine.start();
});

clientSocket.on("error", (error) => {
  throw error;
});

clientSocket.on("close", () => audioEngine.quit());

// Write the received buffer into the engine
clientSocket.on("message", (message) => {
  const { from, data } = JSON.parse(message.toString()) as Message;

  // Ignore broadcasts from ourselves
  if (process.env.DOCKER !== "true" && from === ourName) {
    return;
  }

  audioEngine.write(data);
});

audioEngine.pipe(musicWriteStream);
clientSocket.bind(ports.PEER_CLIENT_PORT);
serverSocket.bind(() => {
  serverSocket.setBroadcast(true);
  serverSocket.setMulticastTTL(128);

  serverSocket.on("error", (error) => {
    throw error;
  });

  serverSocket.on("close", () => audioEngine.quit());

  audioEngine.on("data", (message: Buffer) => {
    serverSocket.send(
      stringify({
        from: ourName,
        data: message.toString(),
      }),
      0,
      message.length,
      ports.PEER_SERVER_PORT,
      "224.0.0.1",
    );
  });

  musicReadStream.pipe(audioEngine);
});

process.on("exit", async () => {
  serverSocket.close();
  clientSocket.close();

  await new Promise((resolve) => setTimeout(resolve, 500));

  audioEngine.quit();
});
