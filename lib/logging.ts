import type { Backend } from "@/mod.ts";

// deno-lint-ignore no-explicit-any
function backend_log(parent: Backend, ...params: any): void {
  if (parent.appConfig.debug) {
    console.log(...params);
  }
}

export { backend_log };