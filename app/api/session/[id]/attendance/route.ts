import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface AttendanceRequestBody {
  presentIds: (string | number)[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = Number(params.id);

  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    // Expecting { presentIds: [...] } object from frontend
    const { presentIds = [] }: AttendanceRequestBody = await request.json();
    const numericPresentIds = presentIds.map((id) => Number(id)).filter((id) => !isNaN(id));

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({
      where: { name: session.courseName },
      include: { students: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allStudentIds = course.students.map((student) => student.id);
    const presentSet = new Set(numericPresentIds);
    const absentIds = allStudentIds.filter((id) => !presentSet.has(id));

    // Validate IDs before connecting
    const validPresentStudents = await prisma.student.findMany({
      where: { id: { in: numericPresentIds } },
    });

    const validAbsentStudents = await prisma.student.findMany({
      where: { id: { in: absentIds } },
    });

    // Clear old present and absent relations
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        present: { set: [] },
        absent: { set: [] },
      },
    });

    // Prepare connect data only if non-empty arrays
    const dataToUpdate: any = {
      status: false,
    };
    if (validPresentStudents.length > 0) {
      dataToUpdate.present = { connect: validPresentStudents.map((s) => ({ id: s.id })) };
    }
    if (validAbsentStudents.length > 0) {
      dataToUpdate.absent = { connect: validAbsentStudents.map((s) => ({ id: s.id })) };
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: dataToUpdate,
      include: {
        present: true,
        absent: true,
      },
    });

    // Update attendance counts
    const presentUpdates = validPresentStudents.map((s) =>
      prisma.student.update({
        where: { id: s.id },
        data: { attendance: { increment: 1 } },
      })
    );

    const absentUpdates = validAbsentStudents.map((s) =>
      prisma.student.update({
        where: { id: s.id },
        data: { absent: { increment: 1 } },
      })
    );

    await Promise.all([...presentUpdates, ...absentUpdates]);

    return NextResponse.json({
      message: "Attendance updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Failed to update attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
