import type { Endpoint, EndpointHandler, ExportsType, ParsedEndpoint, ParsedMethod } from '@/types/types.d.ts';
import * as path from "jsr:@std/path@1.0.8";
import type { Backend } from "@/mod.ts";
import { buildMiddlewareSteps } from "@/endpoints/middlewareHandler.ts";

async function loadEndpointsFromFolder(backend: Backend, _path: string) {
  backend.log('📂 Loading endpoints from folder', _path);
  const files = Deno.readDirSync(_path);
  const endpoints = [];

  for (const file of files) {
    if (file.isFile) {
      backend.log(`📄 Processing file: ${file.name}`);
      const globePath =  'file:' + path.join(_path, file.name);
      const endpoint = await import(globePath);
      backend.log(`✅ Successfully imported endpoint from ${file.name}`);
      endpoints.push(endpoint);
    }
  }

  return loadEndpoints(backend, endpoints);
}

function loadEndpoints(backend: Backend, endpoints: Endpoint[]) {
  backend.log(`🔍 Processing ${endpoints.length} endpoints`);
  const parsedEndpoints: ParsedEndpoint[] = [];

  endpoints.forEach((endpoint: Endpoint, index) => {
    backend.log(`🔍 Processing endpoint ${index + 1}/${endpoints.length}`);
    
    // Look for Path Export, path is required
    const path = endpoint.path;
    if (!path) {
      backend.log('❌ ERROR: Missing path in endpoint');
      throw new Error('LOADENDPOINTS - ERROR - No path found for endpoint');
    }
    backend.log(`📍 Found path: ${path}`);

    // Look for Methods Export
    const methods: ParsedMethod[] = [];
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    backend.log(`🔍 Checking for HTTP methods in endpoint: ${path}`);
    
    allowedMethods.forEach((method) => {
      if (endpoint[method as keyof Endpoint]) {
        backend.log(`✅ Found ${method} method for ${path}`);
        methods.push({
          method,
          handler: endpoint[method as keyof Endpoint] as EndpointHandler,
        });
      }
    });

    if (methods.length === 0) {
      backend.log(`❌ ERROR: No methods found for endpoint: ${path}`);
      throw new Error(
        'LOADENDPOINTS - ERROR - No methods found for endpoint, path: ' + path
      );
    }
    backend.log(`✅ Total methods found for ${path}: ${methods.length}`);

    const otherExports: ExportsType = {};
    const excludes = ['path', ...allowedMethods, 'middlewares'];
    const keys = Object.keys(endpoint);
    backend.log(`🔍 Processing additional exports for ${path}`);
    keys.forEach(key => {
      if (!excludes.includes(key)) {
        backend.log(`✅ Found additional export: ${key}`);
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
    backend.log(`🔍 Processing ${middlewareKeys.length} middlewares for ${path}`);
    const middlewares = buildMiddlewareSteps(backend, parsedEndpoint, middlewareKeys);
    parsedEndpoint.middlewares = middlewares;
    backend.log(`✅ Successfully processed middlewares for ${path}`);

    parsedEndpoints.push(parsedEndpoint);
    backend.log(`✅ Finished processing endpoint: ${path}`);
  });

  backend.log(`✅ Completed processing all endpoints. Total: ${parsedEndpoints.length}`);
  return parsedEndpoints;
}

export { loadEndpoints, loadEndpointsFromFolder };
