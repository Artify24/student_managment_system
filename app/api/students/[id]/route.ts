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
    const student = await prisma.student.findUnique({ where: { id } });
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
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    // Branch is enum, so validate and assign if present
    if (body.branch !== undefined) {
      const branchValues = ["THANE", "NERUL", "BORIVALI", "DADAR"];
      if (!branchValues.includes(body.branch)) {
        return NextResponse.json(
          { error: `Invalid branch. Must be one of: ${branchValues.join(", ")}` },
          { status: 400 }
        );
      }
      data.branch = body.branch;
    }

    // Update courses relation
    // Expecting body.courses as an array of course IDs to set for the student
    if (Array.isArray(body.courses)) {
      data.courses = {
        set: body.courses.map((courseId: number) => ({ id: courseId })),
      };
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data,
      include: { courses: true }, // Optional: return courses with the student
    });

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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