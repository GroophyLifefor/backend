import { Hono } from 'npm:hono@4.7.1';
import {
  loadEndpoints,
  loadEndpointsFromFolder,
} from '@/endpoints/loadEndpoints.ts';
import { Endpoint, ParsedEndpoint, AppConfigType, OptionalAppConfigType } from '@/types/types.d.ts';

const defaultConfig: AppConfigType = {
  debug: false,
  port: 3030,
}

class Backend {
  app: Hono;
  endpointList: ParsedEndpoint[] = [];

  appConfig: AppConfigType = defaultConfig;

  constructor(appConfig: OptionalAppConfigType) {
    const config = { ...defaultConfig, ...appConfig };
    this.appConfig = config;
    this.app = new Hono();
  }

  loadEndpoints(endpointEntries: Endpoint[]) {
    const endpoints = loadEndpoints(endpointEntries);
    this.endpointList.push(...endpoints);
  }

  async loadEndpointsFromFolder(path: string) {
    const endpoints = await loadEndpointsFromFolder(path);
    this.endpointList.push(...endpoints);
  }

  serve() {
    Deno.serve({ port: this.appConfig.port }, this.app.fetch);
  }
}

export { Backend };
