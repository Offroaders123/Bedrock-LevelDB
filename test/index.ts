import { fileURLToPath } from "node:url";
import { DimensionID, readDatabase } from "../src/index.js";

const WORLD = fileURLToPath(new URL("../test/world/My World/db",import.meta.url));

const data = await readDatabase(WORLD);
console.log(data["~local_player"]?.data.abilities);
console.log(DimensionID[data["~local_player"]?.data.DimensionId.valueOf()!]);
console.log(data.portals?.data.data.PortalRecords.map(portal => DimensionID[portal.DimId.valueOf()]));