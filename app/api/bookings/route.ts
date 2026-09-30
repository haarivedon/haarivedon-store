import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { bookingSchema } from "@/lib/validations/booking";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: z.treeifyError(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const booking = await prisma.booking.create({ data: parsed.data });
    return NextResponse.json(
      {
        message:
          "Your session request has been received. We'll reach out shortly to confirm.",
        id: booking.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
