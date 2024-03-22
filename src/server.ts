import Datagram from "dgram";
import { ports } from "./constants";
import { v4 } from "uuid";
import NanoTimer from "nanotimer";

const timer = new NanoTimer();
const serverSocket = Datagram.createSocket({ type: "udp4" });
const commandAndControlSocket = Datagram.createSocket({ type: "udp4" });

commandAndControlSocket.on("listening", () => {
  commandAndControlSocket.setBroadcast(true);
  commandAndControlSocket.setMulticastTTL(128);
  commandAndControlSocket.addMembership("224.0.0.1");
});

commandAndControlSocket.on("message", () =>
  serverSocket.bind(() => {
    serverSocket.setBroadcast(true);
    serverSocket.setMulticastTTL(128);

    serverSocket.on("error", (error) => {
      throw error;
    });

    console.log("Sending muzak.");

    const data = (
      v4() +
      v4() +
      v4() +
      v4() +
      v4() +
      v4() +
      v4() +
      v4() +
      v4() +
      v4()
    ).slice(0, 80);

    timer.setInterval(
      () => {
        serverSocket.send(
          data,
          0,
          data.length,
          ports.PEER_CLIENT_PORT,
          "224.0.0.1",
        );
      },
      "",
      "5ms",
      console.error,
    );
  }),
);

commandAndControlSocket.bind(ports.SERVER_COMMAND_AND_CONTROL_PORT);

process.on("exit", async () => {
  serverSocket.close();
  timer.clearInterval();

  await new Promise((resolve) => setTimeout(resolve, 500));
});
