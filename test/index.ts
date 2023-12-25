import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const actorprefixOrDigp = /actorprefix|digp/;
const data = await readDatabase(WORLD);
console.log(
  // Object.fromEntries(
    Object.entries(data)
      .filter(entry => entry[0].match(actorprefixOrDigp))
      .map(([key,value]) => {
        const buffer: Buffer = Buffer.from(key.replace(actorprefixOrDigp,""));
        // console.log(buffer);

        switch (true){
          case key.startsWith("actorprefix"): {
            const x: number = buffer.readUInt32BE(0);
            const y: number = buffer.readUInt32BE(0);
            const name: string = `${x}, ${y}`;
            return [name,value.data.identifier];
          }
          case key.startsWith("digp"): {
            return [buffer,value];
          }
        }
      })
  // )
);