import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!id) {
    return NextResponse.json(
      { error: "Student ID is required" },
      { status: 400 }
    );
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        courses: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid or missing student ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // Build update data object dynamically
    const data: any = {};

    if (body.firstName !== undefined) data.firstName = body.firstName;
    if (body.lastName !== undefined) data.lastName = body.lastName;
    if (body.email !== undefined) data.email = body.email;
    if (body.address !== undefined) data.address = body.address;
    if (body.feesPaid !== undefined) data.feesPaid = body.feesPaid;
    if (body.feesAmount !== undefined) data.feesAmount = body.feesAmount;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    // Branch is enum, so validate and assign if present
    if (body.branch !== undefined) {
      const branchValues = ["THANE", "NERUL", "BORIVALI", "DADAR"];
      if (!branchValues.includes(body.branch)) {
        return NextResponse.json(
          {
            error: `Invalid branch. Must be one of: ${branchValues.join(", ")}`,
          },
          { status: 400 }
        );
      }
      data.branch = body.branch;
    }

    // If courses are sent as array of names (strings)
    if (Array.isArray(body.courses)) {
      // Find courses by their names in DB
      const coursesFound = await prisma.course.findMany({
        where: { name: { in: body.courses } },
        select: { id: true },
      });

      if (coursesFound.length !== body.courses.length) {
        return NextResponse.json(
          { error: "One or more course names not found" },
          { status: 400 }
        );
      }

      // Update relation using course IDs
      data.courses = {
        set: coursesFound.map((course) => ({ id: course.id })),
      };
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data,
      include: { courses: true }, 
    });

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!id) {
    return NextResponse.json(
      { error: "Student ID is required" },
      { status: 400 }
    );
  }

  try {
    const deletedStudent = await prisma.student.delete({ where: { id } });
    return NextResponse.json(deletedStudent);
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
