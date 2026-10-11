import { TsRestHttpError } from "@ts-rest/serverless";
import { prisma } from "@repo/db";
import { requireAdmin, type SessionUser } from "./session";
import { revalidate } from "../../lib/revalidate";
import { toPaginationMeta, toPrismaPage } from "../../lib/pagination";

/** A field the record is missing before it can be published. */
export type Missing = { field: string; message: string };

type Delegate = {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
  count: (args?: unknown) => Promise<number>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
};

export type CollectionConfig<Record_, Wire> = {
  /** Prisma model delegate, e.g. `prisma.course`. */
  delegate: unknown;
  /** Fields a `?search=` query matches against. */
  searchFields: string[];
  /** Field pair used for ordering lists. */
  orderBy: Record<string, "asc" | "desc">[];
  serialize: (record: Record_) => Wire;
  /** What must be filled in before `published: true` is allowed. */
  publishRequirements: (record: Record_) => Promise<Missing[]> | Missing[];
  /** Public paths to revalidate after a write. */
  paths: (record: Record_) => string[];
};

/**
 * One implementation for every admin collection.
 *
 * The shared rules live here, so they cannot drift between resources:
 * authentication on every route, uniqueness checks on slug, strict validation
 * at publish time, and the stale-write guard (docs/PLAN.md §3.3).
 */
export function adminCollection<Record_ extends { id: string }, Wire>(
  config: CollectionConfig<Record_, Wire>,
) {
  const model = config.delegate as Delegate;

  const load = async (id: string): Promise<Record_> => {
    const record = (await model.findUnique({ where: { id } })) as Record_ | null;
    if (!record) throw new TsRestHttpError(404, { error: "Not found." });
    return record;
  };

  /**
   * Slugs are unique per collection. Checked here rather than relying on the
   * unique index so the error names the record holding it (§13).
   */
  const assertSlugFree = async (slug: string | undefined, exceptId?: string) => {
    if (!slug) return;
    const existing = (await model.findFirst({ where: { slug } })) as
      | (Record_ & { slug: string; title?: string; name?: string })
      | null;
    if (!existing || existing.id === exceptId) return;

    throw new TsRestHttpError(409, {
      error: `The slug "${slug}" is already used by "${existing.title ?? existing.name ?? existing.id}".`,
    });
  };

  const assertPublishable = async (record: Record_) => {
    const missing = await config.publishRequirements(record);
    if (missing.length === 0) return;

    throw new TsRestHttpError(422, {
      error: "This isn't ready to publish yet.",
      missing,
    });
  };

  return {
    list: async ({ query }: { query: Record<string, unknown> }, ctx: { request: Request }) => {
      await requireAdmin(ctx.request.headers);

      const search = typeof query.search === "string" ? query.search.trim() : "";
      const where = {
        ...(query.published === undefined ? {} : { published: query.published }),
        ...(search
          ? {
              OR: config.searchFields.map((field) => ({
                [field]: { contains: search, mode: "insensitive" },
              })),
            }
          : {}),
      };

      const [records, total] = await Promise.all([
        model.findMany({
          where,
          orderBy: config.orderBy,
          ...toPrismaPage(query as never),
        }) as Promise<Record_[]>,
        model.count({ where }),
      ]);

      return {
        status: 200 as const,
        body: {
          data: records.map(config.serialize),
          meta: toPaginationMeta(query as never, total),
        },
      };
    },

    getById: async (
      { params }: { params: { id: string } },
      ctx: { request: Request },
    ) => {
      await requireAdmin(ctx.request.headers);
      return { status: 200 as const, body: config.serialize(await load(params.id)) };
    },

    create: async (
      { body }: { body: Record<string, unknown> },
      ctx: { request: Request },
    ) => {
      const user = await requireAdmin(ctx.request.headers);
      await assertSlugFree(body.slug as string | undefined);

      // Create as a draft, validate, then flip: that way a publish-on-create
      // that fails validation does not leave a half-checked live record.
      const wantsPublish = body.published === true;
      // Undefined keys are dropped so Prisma applies its own column defaults
      // rather than writing `undefined` into the document.
      const data = Object.fromEntries(
        Object.entries(body).filter(([, value]) => value !== undefined),
      );
      const created = (await model.create({
        data: { ...data, published: false, updatedBy: user.email },
      })) as Record_;

      if (!wantsPublish) {
        return { status: 201 as const, body: config.serialize(created) };
      }

      try {
        await assertPublishable(created);
      } catch (error) {
        await model.delete({ where: { id: created.id } }).catch(() => {});
        throw error;
      }

      const published = (await model.update({
        where: { id: created.id },
        data: { published: true },
      })) as Record_;
      revalidate(config.paths(published));

      return { status: 201 as const, body: config.serialize(published) };
    },

    update: async (
      {
        params,
        body,
      }: { params: { id: string }; body: Record<string, unknown> },
      ctx: { request: Request },
    ) => {
      const user = await requireAdmin(ctx.request.headers);
      const { expectedUpdatedAt, ...changes } = body;
      const existing = (await load(params.id)) as Record_ & { updatedAt: Date };

      // Stale-write guard: refuse rather than overwrite someone else's save.
      if (
        typeof expectedUpdatedAt === "string" &&
        new Date(expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()
      ) {
        return {
          status: 409 as const,
          body: {
            error:
              "This was changed somewhere else after you opened it. Reload to see the current version.",
            current: config.serialize(existing),
          },
        };
      }

      await assertSlugFree(changes.slug as string | undefined, params.id);

      // Same rule on update: a key the editor did not send must not be
      // written at all, or a partial save would blank it.
      const data = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined),
      );
      const updated = (await model.update({
        where: { id: params.id },
        data: { ...data, updatedBy: user.email },
      })) as Record_;

      // Validate the record as it will actually be, not as it was posted.
      if ((updated as { published?: boolean }).published) {
        try {
          await assertPublishable(updated);
        } catch (error) {
          await model.update({
            where: { id: params.id },
            data: { published: (existing as { published?: boolean }).published ?? false },
          });
          throw error;
        }
      }

      revalidate([...config.paths(existing), ...config.paths(updated)]);
      return { status: 200 as const, body: config.serialize(updated) };
    },

    remove: async (
      { params }: { params: { id: string } },
      ctx: { request: Request },
    ) => {
      await requireAdmin(ctx.request.headers);
      const existing = await load(params.id);
      await model.delete({ where: { id: params.id } });
      revalidate(config.paths(existing));

      return { status: 200 as const, body: { id: params.id } };
    },

    reorder: async (
      { body }: { body: { ids: string[] } },
      ctx: { request: Request },
    ) => {
      await requireAdmin(ctx.request.headers);

      await prisma.$transaction(
        body.ids.map((id, index) =>
          (model as unknown as {
            update: (args: unknown) => Promise<unknown>;
          }).update({ where: { id }, data: { order: index + 1 } }),
        ) as never,
      );

      return { status: 200 as const, body: { updated: body.ids.length } };
    },
  };
}

/** Shared publish checks. */
export const requireText = (
  value: string | null | undefined,
  field: string,
  message: string,
): Missing[] => (value && value.trim() ? [] : [{ field, message }]);

/**
 * An image is only publishable with alt text, and alt text lives on the media
 * record — so publishing checks the library, not just that a URL is present
 * (docs/PLAN.md §13).
 */
export async function requireImageWithAlt(
  url: string | undefined,
  field: string,
): Promise<Missing[]> {
  if (!url || !url.trim()) {
    return [{ field, message: "Add an image." }];
  }

  const media = await prisma.media.findFirst({ where: { url } });
  // An external URL cannot be checked, so it is accepted as-is.
  if (!media) return [];

  return media.alt.trim()
    ? []
    : [{ field, message: "This image needs alt text before it can go live." }];
}

export type { SessionUser };
