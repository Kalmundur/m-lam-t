// Serves the static export in out/, the same way a static host would, for local
// previews and the end-to-end tests. Run `npm run build` first.
//
//   npm run serve                  # http://localhost:3000
//   npm run serve -- --port 3100

import { parseArgs } from "node:util";
import { startStaticServer } from "./lib/static-server";

const { values } = parseArgs({
  options: { port: { type: "string", default: "3000" }, dir: { type: "string", default: "out" } },
});

startStaticServer({ dir: values.dir, port: Number(values.port) }).then(
  () => console.log(`Serving ${values.dir}/ at http://localhost:${values.port}`),
  (error: Error) => {
    console.error(error.message);
    process.exit(1);
  },
);
