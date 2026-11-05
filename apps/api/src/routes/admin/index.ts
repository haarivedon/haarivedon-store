import {
  contract,
  parseSiteContent,
  siteContentSchemas,
  type AdminBlogPost,
  type AdminCourse,
  type AdminProduct,
  type AdminService,
  type AdminTestimonial,
  type Booking,
  type Enquiry,
  type Media,
  type PredictionRequest,
} from "@repo/contract";
import {
  prisma,
  type Prisma,
  type BlogPost as BlogPostRecord,
  type Booking as BookingRecord,
  type Course as CourseRecord,
  type Enquiry as EnquiryRecord,
  type Media as MediaRecord,
  type PredictionRequest as PredictionRecord,
  type Product as ProductRecord,
  type Service as ServiceRecord,
  type Testimonial as TestimonialRecord,
} from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { z } from "zod";
import {
  changePasswordSchema,
  clearedSessionCookie,
  hashPassword,
  login,
  logout,
  logoutEverywhere,
  readSessionCookie,
  requireAdmin,
  sessionCookie,
  verifyPassword,
} from "./session";
import {
  adminCollection,
  requireImageWithAlt,
  requireText,
  type Missing,
} from "./collection";
import { deleteObject } from "../../lib/storage";
import { queueKundali } from "../../lib/kundali/queue";
import { clientIp } from "../../lib/rate-limit";
import { revalidate } from "../../lib/revalidate";
import { toPaginationMeta, toPrismaPage } from "../../lib/pagination";

// ── Serializers ───────────────────────────────────────────────────────────

const course = (r: CourseRecord): AdminCourse => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  category: r.category as AdminCourse["category"],
  level: r.level as AdminCourse["level"],
  format: r.format as AdminCourse["format"],
  summary: r.summary,
  description: r.description,
  outline: r.outline,
  duration: r.duration,
  language: r.language,
  price: r.price,
  currency: r.currency,
  image: r.image,
  relatedSlugs: r.relatedSlugs,
  certificate: r.certificate,
  featured: r.featured,
  order: r.order,
  published: r.published,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt.toISOString(),
});

const product = (r: ProductRecord): AdminProduct => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  family: r.family as AdminProduct["family"],
  category: r.category,
  summary: r.summary,
  description: r.description,
  price: r.price,
  currency: r.currency,
  images: r.images,
  attributes: r.attributes ?? null,
  inStock: r.inStock,
  featured: r.featured,
  order: r.order,
  published: r.published,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt.toISOString(),
});

const service = (r: ServiceRecord): AdminService => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  summary: r.summary,
  description: r.description,
  icon: r.icon,
  startingPrice: r.startingPrice,
  discountedPrice: r.discountedPrice,
  currency: r.currency,
  highlights: r.highlights,
  image: r.image,
  category: r.category ?? "",
  featured: r.featured ?? false,
  badge: r.badge ?? "",
  showOnHome: r.showOnHome ?? false,
  order: r.order,
  published: r.published,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt.toISOString(),
});

const testimonial = (r: TestimonialRecord): AdminTestimonial => ({
  id: r.id,
  name: r.name,
  quote: r.quote,
  rating: r.rating,
  location: r.location,
  order: r.order,
  published: r.published,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt.toISOString(),
});

const blogPost = (r: BlogPostRecord): AdminBlogPost => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  content: r.content,
  coverImage: r.coverImage,
  tags: r.tags,
  publishedAt: r.publishedAt.toISOString(),
  order: r.order,
  published: r.published,
  updatedBy: r.updatedBy,
  updatedAt: r.updatedAt.toISOString(),
});

const media = (r: MediaRecord): Media => ({
  id: r.id,
  key: r.key,
  url: r.url,
  alt: r.alt,
  width: r.width,
  height: r.height,
  bytes: r.bytes,
  mimeType: r.mimeType,
  createdAt: r.createdAt.toISOString(),
});

const booking = (r: BookingRecord): Booking => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  sessionType: r.sessionType as Booking["sessionType"],
  service: r.service,
  dateOfBirth: r.dateOfBirth.toISOString(),
  timeOfBirth: r.timeOfBirth,
  birthPlace: r.birthPlace,
  birthLat: r.birthLat,
  birthLng: r.birthLng,
  birthTz: r.birthTz,
  message: r.message,
  status: r.status as Booking["status"],
  kundaliStatus: r.kundaliStatus as Booking["kundaliStatus"],
  hasKundali: r.kundaliKey !== "",
  reference: r.reference,
  amount: r.amount,
  paymentStatus: r.paymentStatus as Booking["paymentStatus"],
  scheduled: r.calendlyEventUri !== "",
  internalNote: r.internalNote,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

const prediction = (r: PredictionRecord): PredictionRequest => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  dateOfBirth: r.dateOfBirth.toISOString(),
  timeOfBirth: r.timeOfBirth,
  placeOfBirth: r.placeOfBirth,
  focusArea: r.focusArea as PredictionRequest["focusArea"],
  question: r.question,
  internalNote: r.internalNote,
  status: r.status as PredictionRequest["status"],
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

const enquiry = (r: EnquiryRecord): Enquiry => ({
  id: r.id,
  kind: r.kind as Enquiry["kind"],
  name: r.name,
  email: r.email,
  phone: r.phone,
  itemSlug: r.itemSlug,
  itemTitle: r.itemTitle,
  message: r.message,
  status: r.status as Enquiry["status"],
  reference: r.reference,
  quantity: r.quantity,
  amount: r.amount,
  paymentStatus: r.paymentStatus as Enquiry["paymentStatus"],
  razorpayOrderId: r.razorpayOrderId,
  razorpayPaymentId: r.razorpayPaymentId,
  internalNote: r.internalNote,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// ── Inbox helper: list + patch, shared by the three submission types ──────

const searchFilter = (search: string | undefined, fields: string[]) =>
  search?.trim()
    ? {
        OR: fields.map((field) => ({
          [field]: { contains: search.trim(), mode: "insensitive" as const },
        })),
      }
    : {};

// ── Routes ────────────────────────────────────────────────────────────────

export const adminRouter = tsr.router(contract.admin, {
  stats: async (_input, { request }) => {
    await requireAdmin(request.headers);

    const [bookings, enquiries, products, courses, services, blog] =
      await Promise.all([
        prisma.booking.count(),
        prisma.enquiry.count(),
        prisma.product.count({ where: { published: true } }),
        prisma.course.count({ where: { published: true } }),
        prisma.service.count({ where: { published: true } }),
        prisma.blogPost.count({ where: { published: true } }),
      ]);

    const [pendBookings, pendEnquiries, pendPredictions] = await Promise.all([
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.enquiry.count({ where: { status: "pending" } }),
      prisma.predictionRequest.count({ where: { status: "pending" } }),
    ]);

    const [bRev, eRev] = await Promise.all([
      prisma.booking.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { paymentStatus: "paid" },
      }),
      prisma.enquiry.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { paymentStatus: "paid" },
      }),
    ]);

    // 14-day activity: fetch createdAt and bucket by day in JS.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);
    const [bDates, eDates] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.enquiry.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);
    const buckets = new Map<
      string,
      { date: string; bookings: number; enquiries: number }
    >();
    const order: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, bookings: 0, enquiries: 0 });
      order.push(key);
    }
    for (const b of bDates) {
      const row = buckets.get(b.createdAt.toISOString().slice(0, 10));
      if (row) row.bookings += 1;
    }
    for (const e of eDates) {
      const row = buckets.get(e.createdAt.toISOString().slice(0, 10));
      if (row) row.enquiries += 1;
    }

    const bookingPayments = await Promise.all(
      (["paid", "pending", "none", "failed"] as const).map(async (s) => ({
        label: s === "none" ? "draft" : s,
        value: await prisma.booking.count({ where: { paymentStatus: s } }),
      })),
    );
    const enquiryStatuses = await Promise.all(
      (["pending", "contacted", "enrolled", "closed"] as const).map(
        async (s) => ({
          label: s,
          value: await prisma.enquiry.count({ where: { status: s } }),
        }),
      ),
    );

    const recent = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        reference: true,
        name: true,
        service: true,
        amount: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    return {
      status: 200 as const,
      body: {
        totals: { bookings, enquiries, products, courses, services, blog },
        pending: {
          bookings: pendBookings,
          enquiries: pendEnquiries,
          predictions: pendPredictions,
        },
        revenue: {
          total: (bRev._sum.amount ?? 0) + (eRev._sum.amount ?? 0),
          paidCount: bRev._count + eRev._count,
        },
        activity: order.map((k) => buckets.get(k)!),
        enquiryStatuses: enquiryStatuses.filter((s) => s.value > 0),
        bookingPayments: bookingPayments.filter((s) => s.value > 0),
        recentBookings: recent.map((b) => ({
          id: b.id,
          reference: b.reference,
          name: b.name,
          service: b.service,
          amount: b.amount,
          paymentStatus: b.paymentStatus as
            | "none"
            | "pending"
            | "paid"
            | "failed",
          createdAt: b.createdAt.toISOString(),
        })),
      },
    };
  },

  login: async ({ body }, { request, responseHeaders }) => {
    const result = await login(body.email, body.password, {
      userAgent: request.headers.get("user-agent") ?? "",
      ip: clientIp(request.headers),
    });

    if (!result.ok) {
      return { status: result.status, body: { error: result.error } };
    }

    responseHeaders.set(
      "set-cookie",
      sessionCookie(result.token, result.expiresAt),
    );
    return { status: 200 as const, body: { user: result.user } };
  },

  logout: async (_input, { request, responseHeaders }) => {
    await logout(readSessionCookie(request.headers));
    responseHeaders.set("set-cookie", clearedSessionCookie());
    return { status: 200 as const, body: { ok: true } };
  },

  session: async (_input, { request }) => {
    const user = await requireAdmin(request.headers);
    return { status: 200 as const, body: { user } };
  },

  changePassword: async ({ body }, { request, responseHeaders }) => {
    const user = await requireAdmin(request.headers);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 422 as const, body: { error: "Check the password fields." } };
    }

    const record = await prisma.adminUser.findUnique({ where: { id: user.id } });
    if (
      !record ||
      !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))
    ) {
      return {
        status: 401 as const,
        body: { error: "That current password is not right." },
      };
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    // Changing a password signs out everywhere, this session included.
    await logoutEverywhere(user.id);
    responseHeaders.set("set-cookie", clearedSessionCookie());

    return { status: 200 as const, body: { ok: true } };
  },

  courses: adminCollection<CourseRecord, AdminCourse>({
    delegate: prisma.course,
    searchFields: ["title", "slug", "summary"],
    orderBy: [{ order: "asc" }, { title: "asc" }],
    serialize: course,
    publishRequirements: async (record) => [
      ...requireText(record.summary, "summary", "Add a short summary."),
      ...requireText(record.description, "description", "Add the description."),
      ...requireText(record.duration, "duration", "How long does it run?"),
      ...(await requireImageWithAlt(record.image, "image")),
    ],
    paths: (record) => ["/courses", `/courses/${record.slug}`, "/"],
  }),

  products: adminCollection<ProductRecord, AdminProduct>({
    delegate: prisma.product,
    searchFields: ["name", "slug", "summary"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    serialize: product,
    publishRequirements: async (record) => [
      ...requireText(record.summary, "summary", "Add a short summary."),
      ...requireText(record.description, "description", "Add the description."),
      ...(await requireImageWithAlt(record.images[0], "images")),
    ],
    paths: (record) => ["/products", `/products/${record.slug}`, "/"],
  }),

  services: adminCollection<ServiceRecord, AdminService>({
    delegate: prisma.service,
    searchFields: ["title", "slug", "summary"],
    orderBy: [{ order: "asc" }, { title: "asc" }],
    serialize: service,
    publishRequirements: (record): Missing[] => [
      ...requireText(record.summary, "summary", "Add a short summary."),
    ],
    paths: () => ["/services", "/"],
  }),

  testimonials: adminCollection<TestimonialRecord, AdminTestimonial>({
    delegate: prisma.testimonial,
    searchFields: ["name", "quote", "location"],
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    serialize: testimonial,
    publishRequirements: (): Missing[] => [],
    paths: () => ["/"],
  }),
  blog: adminCollection<BlogPostRecord, AdminBlogPost>({
    delegate: prisma.blogPost,
    searchFields: ["title", "slug", "excerpt"],
    orderBy: [{ publishedAt: "desc" }],
    serialize: blogPost,
    publishRequirements: (record): Missing[] => [
      ...requireText(record.excerpt, "excerpt", "Add a short excerpt."),
      ...requireText(record.content, "content", "Write the post."),
      ...requireText(record.coverImage, "coverImage", "Add a cover image."),
    ],
    paths: (record) => ["/blog", `/blog/${record.slug}`],
  }),

  // ── Page copy ───────────────────────────────────────────────────────────
  getSiteContent: async ({ params }, { request }) => {
    await requireAdmin(request.headers);
    const row = await prisma.siteContent.findUnique({
      where: { key: params.key },
    });

    return {
      status: 200 as const,
      // Never 404 a key: an unsaved key returns its schema defaults so the
      // form opens populated rather than empty (docs/PLAN.md §12).
      body: { key: params.key, data: parseSiteContent(params.key, row?.data) },
    };
  },

  putSiteContent: async ({ params, body }, { request }) => {
    const user = await requireAdmin(request.headers);
    // Widened to ZodType: the per-key union would otherwise give treeifyError
    // six different error generics to reconcile.
    const schema: z.ZodType = siteContentSchemas[params.key];
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return {
        status: 422 as const,
        body: {
          error: "Some fields need attention.",
          issues: z.treeifyError(parsed.error),
        },
      };
    }

    // Validated above, so the cast is to Prisma's JSON input type only.
    const data = parsed.data as Prisma.InputJsonValue;
    const saved = await prisma.siteContent.upsert({
      where: { key: params.key },
      update: { data, updatedBy: user.email },
      create: { key: params.key, data, updatedBy: user.email },
    });

    revalidate(["/", "/about", "/predictions", "/book"]);
    return { status: 200 as const, body: { key: params.key, data: saved.data } };
  },

  // ── Media ───────────────────────────────────────────────────────────────
  listMedia: async ({ query }, { request }) => {
    await requireAdmin(request.headers);
    const [records, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.media.count(),
    ]);

    return {
      status: 200 as const,
      body: { data: records.map(media), meta: toPaginationMeta(query, total) },
    };
  },

  updateMedia: async ({ params, body }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.media.findUnique({ where: { id: params.id } });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    const updated = await prisma.media.update({
      where: { id: params.id },
      data: { alt: body.alt },
    });
    return { status: 200 as const, body: media(updated) };
  },

  removeMedia: async ({ params }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.media.findUnique({ where: { id: params.id } });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    await deleteObject(existing.key, { bucket: undefined });
    await prisma.media.delete({ where: { id: params.id } });
    return { status: 200 as const, body: { id: params.id } };
  },

  // ── Submissions ─────────────────────────────────────────────────────────
  bookings: async ({ query }, { request }) => {
    await requireAdmin(request.headers);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...searchFilter(query.search, ["name", "phone", "email", "birthPlace"]),
    };

    const [records, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: { data: records.map(booking), meta: toPaginationMeta(query, total) },
    };
  },

  updateBooking: async ({ params, body }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: body,
    });
    return { status: 200 as const, body: booking(updated) };
  },

  regenerateKundali: async ({ params }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    await prisma.booking.update({
      where: { id: params.id },
      data: { kundaliStatus: "pending", kundaliError: "" },
    });
    queueKundali(params.id);

    return { status: 200 as const, body: { status: "pending" } };
  },

  predictions: async ({ query }, { request }) => {
    await requireAdmin(request.headers);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...searchFilter(query.search, ["name", "phone", "email", "placeOfBirth"]),
    };

    const [records, total] = await Promise.all([
      prisma.predictionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.predictionRequest.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: {
        data: records.map(prediction),
        meta: toPaginationMeta(query, total),
      },
    };
  },

  updatePrediction: async ({ params, body }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.predictionRequest.findUnique({
      where: { id: params.id },
    });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    const updated = await prisma.predictionRequest.update({
      where: { id: params.id },
      data: body,
    });
    return { status: 200 as const, body: prediction(updated) };
  },

  enquiries: async ({ query }, { request }) => {
    await requireAdmin(request.headers);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...searchFilter(query.search, ["name", "email", "phone", "itemTitle"]),
    };

    const [records, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.enquiry.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: { data: records.map(enquiry), meta: toPaginationMeta(query, total) },
    };
  },

  updateEnquiry: async ({ params, body }, { request }) => {
    await requireAdmin(request.headers);
    const existing = await prisma.enquiry.findUnique({
      where: { id: params.id },
    });
    if (!existing) return { status: 404 as const, body: { error: "Not found." } };

    const updated = await prisma.enquiry.update({
      where: { id: params.id },
      data: body,
    });
    return { status: 200 as const, body: enquiry(updated) };
  },
});
