import { ports } from "./constants";
import Datagram from "dgram";

const controllerSocket = Datagram.createSocket({ type: "udp4" });

controllerSocket.on("error", (error) => {
  throw error;
});

controllerSocket.bind(() => {
  controllerSocket.setBroadcast(true);
  controllerSocket.setMulticastTTL(128);

  setTimeout(() => {
    console.log("Starting muzak.");
    controllerSocket.send(
      "",
      0,
      "".length,
      ports.SERVER_COMMAND_AND_CONTROL_PORT,
      "224.0.0.1",
    );
  }, 20 * 1000);
});
