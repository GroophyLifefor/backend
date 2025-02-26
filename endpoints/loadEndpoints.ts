import { Ctx, Endpoint, EndpointHandler, ParsedEndpoint } from '@/types/types.d.ts';

async function loadEndpointsFromFolder(path: string) {
  const files = Deno.readDirSync(path);
  const endpoints = [];

  for (const file of files) {
    if (file.isFile) {
      const endpoint = await import('file:' + path + '/' + file.name);
      endpoints.push(endpoint);
    }
  }

  return loadEndpoints(endpoints);
}

function loadEndpoints(endpoints: Endpoint[]) {
  const parsedEndpoints: ParsedEndpoint[] = [];

  endpoints.forEach((endpoint: Endpoint) => {
    // Look for Path Export, path is required
    const path = endpoint.path;
    if (!path) {
      throw new Error('LOADENDPOINTS - ERROR - No path found for endpoint');
    }

    // Look for Methods Export, atleast one method is required
    const methods: { method: string; handler: EndpointHandler }[] = [];
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

    parsedEndpoints.push({
      path,
      methods,
    });
  });

  return parsedEndpoints;
}

export { loadEndpoints, loadEndpointsFromFolder };
