// deno-lint-ignore-file no-explicit-any
import { Hono } from 'hono';
import {
  loadEndpoints,
  loadEndpointsFromFolder,
} from '@/endpoints/loadEndpoints.ts';
import type {
  Endpoint,
  ParsedEndpoint,
  AppConfigType,
  OptionalAppConfigType,
  Ctx,
  Middleware,
  ValidationType,
} from '@/types/types.d.ts';
import { serveEndpoints } from '@/endpoints/serveEndpoints.ts';
import { backend_log } from '@/lib/logging.ts';
import { requestDataValidationMiddleware } from '@/middlewares/requestValidation.ts';

const defaultConfig: AppConfigType = {
  debug: false,
  port: 3030,
};

class Backend {
  app: Hono;
  endpointList: ParsedEndpoint[] = [];
  middlewares: Record<string, Middleware> = {};

  appConfig: AppConfigType = defaultConfig;

  constructor(appConfig: OptionalAppConfigType) {
    const config = { ...defaultConfig, ...appConfig };
    this.appConfig = config;
    this.app = new Hono();
  }

  log(...params: any): void {
    backend_log(this, ...params);
  }

  throw(...params: any): void {
    this.log('❌', ...params);
    console.error('❌', ...params);
    throw new Error(...params);
  }

  setMiddleware(name: string, middleware: Middleware) {
    this.middlewares[name] = middleware;
  }

  loadEndpoints(endpointEntries: Endpoint[]) {
    const endpoints = loadEndpoints(this, endpointEntries);
    endpoints.forEach((endpoint) => {
      this.endpointList.push(endpoint);
    });
  }

  async loadEndpointsFromFolder(path: string): Promise<void> {
    const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

    if (isDenoDeploy) {
      this.throw('Deno Deploy does not support dynamic imports');
    }

    const endpoints = await loadEndpointsFromFolder(this, path);
    endpoints.forEach((endpoint) => {
      this.endpointList.push(endpoint);
    });
  }

  serve() {
    serveEndpoints(this, this.endpointList);
    Deno.serve({ port: this.appConfig.port }, this.app.fetch);
  }
}

export {
  Backend,
  requestDataValidationMiddleware,
  type Ctx,
  type Middleware,
  type ValidationType,
};
