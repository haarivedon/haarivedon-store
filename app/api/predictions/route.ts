import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { predictionSchema } from "@/lib/validations/prediction";

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

  const parsed = predictionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: z.treeifyError(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const prediction = await prisma.predictionRequest.create({
      data: parsed.data,
    });
    return NextResponse.json(
      {
        message:
          "Your prediction request has been received. We'll be in touch soon.",
        id: prediction.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create prediction request:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
