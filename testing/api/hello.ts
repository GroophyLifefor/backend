import { Ctx } from "@/types/types.d.ts";

export async function GET(ctx: Ctx) {
  return await ctx.text('Hello, world!', 200);
}

export const path = '/api/hello';