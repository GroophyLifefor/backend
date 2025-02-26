import { Backend } from "@/mod.ts";
import { join } from "node:path";

function main() {
  const app = new Backend({
    debug: true
  });

  const currentDir = Deno.cwd();
  app.loadEndpointsFromFolder(join(currentDir, "testing", "api"));
}

await main();