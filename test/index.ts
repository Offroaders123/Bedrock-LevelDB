import { fileURLToPath } from "node:url";
import { readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(
  Object.fromEntries(
    Object.entries(data)
      .filter(entry => entry[0].startsWith("actorprefix"))
      .map(([key,value]) => {
        const buffer: Buffer = Buffer.from(key.replace("actorprefix",""));
        // console.log(buffer);
        const x: number = buffer.readUInt32BE(0);
        const y: number = buffer.readUInt32BE(4);
        const name: string = `${x}, ${y}`;
        const id: string = value.data.identifier;
        const trailing: Buffer | null = buffer.length > 8 ? buffer.subarray(8) : null;
        return trailing !== null
          ? [name,[id,trailing]]
          : [name,id];
      })
    )
);