"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ClipboardCheck, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const recentAttendance = [
  { id: "STU001", name: "Alice Johnson", time: "09:15 AM", status: "present", class: "CS-101" },
  { id: "STU002", name: "Bob Smith", time: "09:18 AM", status: "present", class: "CS-101" },
  { id: "STU003", name: "Carol Davis", time: "09:25 AM", status: "late", class: "CS-101" },
  { id: "STU004", name: "David Wilson", time: "09:30 AM", status: "present", class: "MATH-201" },
  { id: "STU005", name: "Eva Brown", time: "10:05 AM", status: "late", class: "MATH-201" },
]

const upcomingSessions = [
  { id: 1, title: "Advanced Algorithms", time: "2:00 PM", type: "Lesson" },
  { id: 2, title: "Database Design", time: "3:30 PM", type: "Assignment" },
  { id: 3, title: "Web Development", time: "4:00 PM", type: "Test" },
  { id: 4, title: "Machine Learning", time: "5:15 PM", type: "Lesson" },
]

export function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to RKDemy Admin Panel</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-orange-50 p-6 relative">
              <div className="absolute right-6 top-6 w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-orange-500" />
              </div>
              <div className="w-24 h-24 rounded-full border-8 border-orange-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-8 border-orange-400"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 70%)" }}
                ></div>
                <span className="text-2xl font-bold text-gray-900">42</span>
              </div>
              <h3 className="text-xl font-bold mt-4 text-gray-900">Lessons</h3>
              <p className="text-sm text-gray-500">of 73 completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-pink-50 p-6 relative">
              <div className="absolute right-6 top-6 w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8 text-pink-500" />
              </div>
              <div className="w-24 h-24 rounded-full border-8 border-pink-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-8 border-pink-400"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 60%)" }}
                ></div>
                <span className="text-2xl font-bold text-gray-900">08</span>
              </div>
              <h3 className="text-xl font-bold mt-4 text-gray-900">Assignments</h3>
              <p className="text-sm text-gray-500">of 24 completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-green-50 p-6 relative">
              <div className="absolute right-6 top-6 w-16 h-16 rounded-full bg-green-200 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-green-500" />
              </div>
              <div className="w-24 h-24 rounded-full border-8 border-green-200 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-8 border-green-400"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 80%)" }}
                ></div>
                <span className="text-2xl font-bold text-gray-900">03</span>
              </div>
              <h3 className="text-xl font-bold mt-4 text-gray-900">Tests</h3>
              <p className="text-sm text-gray-500">of 15 completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses / Recent Attendance */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Attendance</h2>
                <Tabs defaultValue="active">
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.status === "present"
                              ? "border-green-200 text-green-800 bg-green-50"
                              : "border-orange-200 text-orange-800 bg-orange-50"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Calendar & Upcoming */}
        <div className="space-y-8">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Calendar</h2>
                <div className="flex gap-2">
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-sm mb-2">
                <div className="text-gray-500">Mo</div>
                <div className="text-gray-500">Tu</div>
                <div className="text-gray-500">We</div>
                <div className="text-gray-500">Th</div>
                <div className="text-gray-500">Fr</div>
                <div className="text-gray-500">Sa</div>
                <div className="text-gray-500">Su</div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isActive = day === 23 || day === 27
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-full text-sm ${
                        isActive ? "bg-purple-600 text-white" : "hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming</h2>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="text-center w-12">
                      <div className="text-sm font-medium">29</div>
                      <div className="text-xs text-gray-500">Sept</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{session.title}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            session.type === "Lesson"
                              ? "bg-orange-500"
                              : session.type === "Assignment"
                                ? "bg-pink-500"
                                : "bg-green-500"
                          }`}
                        ></span>
                        <span className="text-xs text-gray-500">{session.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
