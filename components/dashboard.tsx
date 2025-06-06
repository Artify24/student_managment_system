"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  CalendarIcon,
  Clock,
  Activity,
  UserCheck,
  UserX,
  BarChart3,
  Eye,
  Plus,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { useAppContext } from "@/lib/context"

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  address: string
  imageUrl: string
  branch: string
  attendance: number
  absent: number
  feesPaid: boolean
  feesAmount: number
  createdAt: string
}

interface Session {
  id: number
  courseName: string
  date: string
  time: string
  status: boolean
  present: Student[]
  absent: Student[]
}

interface RecentAttendanceRecord {
  sessionId: number
  courseName: string
  studentName: string
  time: string
  status: "present" | "absent"
  branch: string
  date: string
}

export function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const { setActiveModule, setActiveSession } = useAppContext()

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch today's sessions
      const todayResponse = await axios.get("/api/session/today")
      const todayData = Array.isArray(todayResponse.data) ? todayResponse.data : []
      setTodaySessions(todayData)

      // Fetch all sessions for statistics
      const allResponse = await axios.get("/api/session")
      const allData = Array.isArray(allResponse.data) ? allResponse.data : []
      setSessions(allData)

      // Generate recent attendance records
      generateRecentAttendance(allData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setSessions([])
      setTodaySessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate recent attendance records from sessions
  const generateRecentAttendance = (sessionsData: Session[]) => {
    const records: RecentAttendanceRecord[] = []

    // Get recent sessions (last 10)
    const recentSessions = sessionsData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    recentSessions.forEach((session) => {
      // Add present students
      session.present.forEach((student) => {
        records.push({
          sessionId: session.id,
          courseName: session.courseName,
          studentName: `${student.firstName} ${student.lastName}`,
          time: session.time,
          status: "present",
          branch: student.branch,
          date: session.date,
        })
      })

      // Add some absent students (limit to keep table manageable)
      session.absent.slice(0, 2).forEach((student) => {
        records.push({
          sessionId: session.id,
          courseName: session.courseName,
          studentName: `${student.firstName} ${student.lastName}`,
          time: session.time,
          status: "absent",
          branch: student.branch,
          date: session.date,
        })
      })
    })

    // Sort by date and time, take most recent 10
    const sortedRecords = records
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`)
        const dateB = new Date(`${b.date} ${b.time}`)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 10)

    setRecentAttendance(sortedRecords)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate statistics
  const stats = {
    totalSessions: sessions.length,
    activeSessions: todaySessions.filter((s) => s.status === true).length,
    completedSessions: sessions.filter((s) => s.status === false).length,
    totalStudents: new Set([
      ...sessions.flatMap((s) => s.present.map((st) => st.id)),
      ...sessions.flatMap((s) => s.absent.map((st) => st.id)),
    ]).size,
    totalPresent: sessions.reduce((sum, s) => sum + s.present.length, 0),
    totalAbsent: sessions.reduce((sum, s) => sum + s.absent.length, 0),
    averageAttendance:
      sessions.length > 0
        ? Math.round(
            (sessions.reduce((sum, s) => sum + s.present.length, 0) /
              (sessions.reduce((sum, s) => sum + s.present.length + s.absent.length, 0) || 1)) *
              100,
          )
        : 0,
  }

  // Get upcoming sessions (active sessions for today)
  const upcomingSessions = todaySessions
    .filter((s) => s.status === true)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4)

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleCreateSession = () => {
    setActiveModule("sessions")
  }

  const handleViewReports = () => {
    setActiveModule("reports")
  }

  const handleStartAttendance = (session: Session) => {
    setActiveSession(session)
    setActiveModule("face-attendance")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome to RKDemy Admin Panel - Real-time attendance insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl" onClick={handleViewReports}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
            onClick={handleCreateSession}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
                <p className="text-sm text-gray-500">Live sessions</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
                <p className="text-sm text-gray-500">Unique students</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-orange-600">{stats.averageAttendance}%</p>
                <p className="text-sm text-gray-500">Average</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalPresent}</p>
                <p className="text-sm text-gray-600">Total Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.totalAbsent}</p>
                <p className="text-sm text-gray-600">Total Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.completedSessions}</p>
                <p className="text-sm text-gray-600">Completed Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Attendance
                </h2>
                <Tabs defaultValue="recent">
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold">Session</TableHead>
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="font-semibold">Time</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-purple-600">#{record.sessionId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-gray-500">{record.branch}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{record.courseName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatTime(record.time)}</p>
                            <p className="text-gray-500">{formatDate(record.date)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              record.status === "present"
                                ? "border-green-200 text-green-800 bg-green-50"
                                : "border-red-200 text-red-800 bg-red-50"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {recentAttendance.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent attendance records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar & Upcoming */}
        <div className="space-y-6">
          {/* Calendar */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  Calendar
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 className="font-semibold">
                  {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
              </div>

              <div className="grid grid-cols-7 text-center text-sm mb-2">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                  <div key={day} className="text-gray-500 font-medium p-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                  const day = i + 1
                  const isToday =
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear() &&
                    day === new Date().getDate()

                  // Check if there are sessions on this day
                  const hasSession = todaySessions.some((session) => {
                    const sessionDate = new Date(session.date)
                    return (
                      sessionDate.getDate() === day &&
                      sessionDate.getMonth() === currentDate.getMonth() &&
                      sessionDate.getFullYear() === currentDate.getFullYear()
                    )
                  })

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors ${
                        isToday
                          ? "bg-purple-600 text-white font-bold"
                          : hasSession
                            ? "bg-blue-100 text-blue-600 font-medium"
                            : "hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Active Sessions
              </h2>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-colors"
                  >
                    <div className="text-center w-12">
                      <div className="text-sm font-medium">{new Date().getDate()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date().toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{session.courseName}</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-gray-500">Active • {session.time}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => handleStartAttendance(session)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}

                {upcomingSessions.length === 0 && (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No active sessions today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
