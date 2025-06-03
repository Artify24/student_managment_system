import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const students = await prisma.student.findMany();
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      address,
      branch,
      imageUrl,
      courses = [],
      attendance,
      feesPaid,
      feesAmount,
    } = body;

    const newStudent = await prisma.student.create({
      data: {
        firstName,
        lastName,
        email,
        address,
        branch,
        imageUrl,
        attendance,
        feesPaid,
        feesAmount,
        courses: {
          connectOrCreate: courses.map((courseName: string) => ({
            where: { name: courseName },
            create: { name: courseName },
          })),
        },
      },
      include: { courses: true },
    });

    return NextResponse.json(newStudent);
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
