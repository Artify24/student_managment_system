import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to handle GET requests to fetch the current session for today
export async function GET() {
  try {
    const today = new Date();

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const session = await prisma.session.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        present: true,
        absent: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 404 });
    }
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}