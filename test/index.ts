import { fileURLToPath } from "node:url";
import { Dimension, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data["~local_player"]?.data.abilities);
console.log(Dimension[data["~local_player"]?.data.DimensionId.valueOf()!]);
console.log(data.portals?.data.data.PortalRecords.map(portal => Dimension[portal.DimId.valueOf()]));