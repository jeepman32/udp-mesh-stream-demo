declare module "simple-udp-stream" {
  interface SimpleUdpStream extends WritableStream {
    end: () => void;
  }

  interface SimpleUdpStreamConstructor {
    new (name: string): SimpleUdpStream;
    (): void;
  }

  export default SimpleUdpStream;
}
