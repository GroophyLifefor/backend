// deno-lint-ignore-file no-explicit-any
import { Context } from "hono";
import z from "zod";

type Ctx = Context;

type ValidationType = {
  query?:
    | {
        [key: string]: z.ZodType<any, any, any> | string | undefined;
      }
    | undefined;
  body?: z.infer<any> | undefined;
};

type EndpointHandler = (ctx: Ctx) => Promise<any>;

type Endpoint = {
  path: string;
  GET?: EndpointHandler;
  POST?: EndpointHandler;
  PUT?: EndpointHandler;
  DELETE?: EndpointHandler;
  PATCH?: EndpointHandler;
  middlewares?: string[];
  validation?: ValidationType;
  openAPI?: string | undefined; // TODO: WILL BE IMPLEMENTED LATER
};

type ParsedEndpoint = {
  path: string;
  methods: { method: string; handler: EndpointHandler }[];
}

type AppConfigType = {
  debug: boolean;
  port: number;
};

type OptionalAppConfigType = {
  [K in keyof AppConfigType]?: AppConfigType[K];
};

export type { Ctx, ValidationType, EndpointHandler, Endpoint, ParsedEndpoint, AppConfigType, OptionalAppConfigType };