import type { H } from 'hono/types';
import { createMiddleware } from 'hono/factory';
import type { Backend, Ctx } from '@/mod.ts';
import type { ApplyMiddlewareParams, ParsedEndpoint } from '@/types/types.d.ts';

async function applyMiddleware(
  backend: Backend,
  request: ApplyMiddlewareParams
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  if (backend.middlewares[request.middleware]) {
    return await backend.middlewares[request.middleware](backend, request);
  } else {
    console.warn(`Middleware ${request.middleware} not found`, request);
    return null;
  }
}

export function buildMiddlewareSteps(
  backend: Backend,
  endpoint: ParsedEndpoint,
  middlewareKeys: string[]
): H[] {
  const { path, middlewares, methods, exports } = endpoint;
  const steps: H[] = [];

  const middlewareList = middlewareKeys || [];

  for (const middleware of middlewareList) {
    // if (middleware === 'auth:validToken') {
    //   steps.push(auth_validToken);
    //   continue;
    // }

    if (typeof middleware === 'string') {
      const middlewareF = createMiddleware(
        async (c: Ctx, next: () => Promise<void>) => {
          const middlewareData = await applyMiddleware(backend, {
            ctx: c,
            middleware,
            endpoint: {
              path,
              middlewares,
              methods,
              exports
            },
          });

          if (middlewareData?.base?.responseStatus === 'end') {
            c.status(middlewareData.base.status);
            const responseBody =
              typeof middlewareData.base.body === 'string'
                ? JSON.parse(middlewareData.base.body)
                : middlewareData.base.body;
            return c.json(responseBody);
          }

          if (!c.get(middleware)) {
            c.set(middleware, {
              middleware: middleware,
              base: {},
              user: middlewareData?.user,
            });
          }
          await next();
        }
      );

      steps.push(middlewareF);
    }
  }

  return steps;
}
