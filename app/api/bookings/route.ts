import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import Booking from "@/lib/models/Booking";
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
    await connectToDatabase();
    const booking = await Booking.create(parsed.data);
    return NextResponse.json(
      {
        message:
          "Your session request has been received. We'll reach out shortly to confirm.",
        id: booking._id,
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
