import { rest } from "msw";

import { nem12Response } from "../data/nem12Processor";

export const typicalHandler = rest.post("/api/process-nem12", (_, res, ctx) => {
  return res(ctx.status(200), ctx.json(nem12Response));
});
