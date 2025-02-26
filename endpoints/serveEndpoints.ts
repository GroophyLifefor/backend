import type { Handler, Hono } from 'hono';
import type { ParsedEndpoint } from '@/types/types.d.ts';
import type { H } from 'hono/types';
import type { Backend } from "@/mod.ts";
import { middlewares } from "@/testing/api/hello.ts";

interface MethodMap {
  [key: string]: (path: string, ...handlers: H[]) => void;
}

function createMethodMap(app: Hono): MethodMap {
  // deno-lint-ignore no-explicit-any
  const options = (path: string, ...handlers: any[]) =>
    app.on('OPTIONS', path, ...(handlers as [Handler]));

  return {
    GET: app.get.bind(app),
    POST: app.post.bind(app),
    PUT: app.put.bind(app),
    DELETE: app.delete.bind(app),
    PATCH: app.patch.bind(app),
    OPTIONS: options,
  };
}

function serveEndpoints(backend: Backend, endpointList: ParsedEndpoint[]) {
  const methodMap = createMethodMap(backend.app);

  for (const endpoint of endpointList) {
    const methods = endpoint.methods;
    const middlewares = endpoint.middlewares;

    for (const method of methods) {
      backend.log(`Serving ${method.method} ${endpoint.path}`);
      
      methodMap[method.method](endpoint.path, ...middlewares, async (c) => {
        const res = await method.handler(c);
        return res;
      });
    }
  }
}

export { serveEndpoints };
