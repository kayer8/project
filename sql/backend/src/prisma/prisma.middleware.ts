export type PrismaMiddleware = (
  params: unknown,
  next: (params: unknown) => Promise<unknown>,
) => Promise<unknown>;
