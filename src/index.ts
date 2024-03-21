import Datagram from "dgram";
import { createNameId } from "mnemonic-id";
import { AudioIO, getDevices, getHostAPIs } from "naudiodon";
import { createReadStream, createWriteStream } from "fs";
import { ports } from "./constants";

interface Message {
  from: string;
  data: Buffer;
}

const ourName = createNameId();
const serverSocket = Datagram.createSocket({ type: "udp4" });
const clientSocket = Datagram.createSocket({ type: "udp4" });
const musicWriteStream = createWriteStream("scarlett_fire.raw");
const musicReadStream = createReadStream("scarlett_fire.mp3");

console.log(
  "============================\r\n\r\n\r\n",
  getDevices(),
  "============================\r\n\r\n\r\n",
  getHostAPIs(),
  "============================\r\n\r\n\r\n",
);

const audioEngine = AudioIO({
  outOptions: {
    channelCount: 2,
    sampleFormat: 1,
    sampleRate: 16,
    deviceId: -1,
    closeOnError: false,
  },
  inOptions: {
    channelCount: 2,
    sampleFormat: 1,
    sampleRate: 16,
    deviceId: -1,
    closeOnError: false,
  },
});

clientSocket.on("listening", () => {
  clientSocket.setBroadcast(true);
  clientSocket.setMulticastTTL(128);
  clientSocket.addMembership("224.0.0.1");
});

clientSocket.on("listening", () => audioEngine.start());
clientSocket.on("error", (error) => {
  throw error;
});

clientSocket.on("close", () => audioEngine.quit());

// Write the received buffer into the engine
clientSocket.on("message", (message) => {
  const { from, data } = JSON.parse(message.toString()) as Message;

  // Ignore broadcasts from ourselves
  if (from === ourName) {
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

  audioEngine.on("data", (message: Buffer) =>
    serverSocket.send(
      JSON.stringify({
        from: ourName,
        data: message,
      } satisfies Message),
      0,
      message.length,
      ports.PEER_SERVER_PORT,
      "224.0.0.1",
    ),
  );

  musicReadStream.pipe(audioEngine);
});

process.on("exit", () => {
  serverSocket.close();
  clientSocket.close();
  audioEngine.end();
});
