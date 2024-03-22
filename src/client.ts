import Datagram from "dgram";
import path from "path";
import { createWriteStream } from "fs";
import { ports } from "./constants";
import { createNameId } from "mnemonic-id";

const clientSocket = Datagram.createSocket({ type: "udp4" });

const musicWriteStream = createWriteStream(
  path.join(import.meta.dirname, `./1_${createNameId()}_random_data.raw`),
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
clientSocket.on("message", (message) =>
  musicWriteStream.write(Buffer.from(message)),
);

clientSocket.bind(ports.PEER_CLIENT_PORT);

process.on("exit", async () => {
  clientSocket.close();

  await new Promise((resolve) => setTimeout(resolve, 500));
});
