/** Translates `page`/`perPage` into Prisma's `skip`/`take`. */
export const toPrismaPage = ({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) => ({ skip: (page - 1) * perPage, take: perPage });

export const toPaginationMeta = (
  { page, perPage }: { page: number; perPage: number },
  total: number,
) => ({
  page,
  perPage,
  total,
  totalPages: Math.max(1, Math.ceil(total / perPage)),
});
