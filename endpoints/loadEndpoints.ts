import type { Endpoint, EndpointHandler, ExportsType, ParsedEndpoint, ParsedMethod } from '@/types/types.d.ts';
import * as path from "jsr:@std/path@1.0.8";
import type { Backend } from "@/mod.ts";
import { buildMiddlewareSteps } from "@/endpoints/middlewareHandler.ts";

async function loadEndpointsFromFolder(backend: Backend, _path: string) {
  const files = Deno.readDirSync(_path);
  const endpoints = [];

  for (const file of files) {
    if (file.isFile) {
      const globePath =  'file:' + path.join(_path, file.name);
      const endpoint = await import(globePath);
      endpoints.push(endpoint);
    }
  }

  return loadEndpoints(backend, endpoints);
}

function loadEndpoints(backend: Backend, endpoints: Endpoint[]) {
  const parsedEndpoints: ParsedEndpoint[] = [];

  endpoints.forEach((endpoint: Endpoint) => {
    // Look for Path Export, path is required
    const path = endpoint.path;
    if (!path) {
      throw new Error('LOADENDPOINTS - ERROR - No path found for endpoint');
    }

    // Look for Methods Export, atleast one method is required
    const methods: ParsedMethod[] = [];
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    allowedMethods.forEach((method) => {
      if (endpoint[method as keyof Endpoint]) {
        methods.push({
          method,
          handler: endpoint[method as keyof Endpoint] as EndpointHandler,
        });
      }
    });

    if (methods.length === 0) {
      throw new Error(
        'LOADENDPOINTS - ERROR - No methods found for endpoint, path: ' + path
      );
    }

    const otherExports: ExportsType = {};
    const excludes = ['path', ...allowedMethods, 'middlewares'];
    const keys = Object.keys(endpoint);
    keys.forEach(key => {
      if (!excludes.includes(key)) {
        otherExports[key] = endpoint[key as keyof Endpoint];
      }
    })

    const parsedEndpoint: ParsedEndpoint = {
      path,
      methods,
      middlewares: [],
      exports: otherExports,
    };

    const middlewareKeys = endpoint.middlewares ?? [];
    const middlewares = buildMiddlewareSteps(backend, parsedEndpoint, middlewareKeys);
    parsedEndpoint.middlewares = middlewares;

    parsedEndpoints.push(parsedEndpoint);
  });

  return parsedEndpoints;
}

export { loadEndpoints, loadEndpointsFromFolder };
