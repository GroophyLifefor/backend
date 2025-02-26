import {
  Backend,
  requestDataValidationMiddleware,
  type Middleware,
} from '@/mod.ts';
import { join } from 'node:path';

async function main() {
  const app = new Backend({
    debug: true,
  });

  const currentDir = Deno.cwd();
  await app.loadEndpointsFromFolder(join(currentDir, 'testing', 'api'));

  const loggerMiddleware: Middleware = (backend, request) => {
    backend.log('New request to ', request.ctx.req.path);
    return { user: {} };
  };

  app.setMiddleware('logger', loggerMiddleware);
  app.setMiddleware('dataValidation', requestDataValidationMiddleware);

  app.serve();
}

await main();
