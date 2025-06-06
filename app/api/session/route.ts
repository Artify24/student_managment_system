import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to handle GET requests to fetch the current session for today
export async function GET() {
  try {
  
    const session = await prisma.session.findMany({
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

// Function to handle POST requests to create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, time } = body;

    if (!courseName || !time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newSession = await prisma.session.create({
      data: {
        courseName,
        date: new Date(),
        time,
      },
    });
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
