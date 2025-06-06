"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  UserCheck,
  UserX,
  Mail,
  Printer,
  FileSpreadsheet,
  Activity,
} from "lucide-react"
import axios from "axios"

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

interface AttendanceRecord {
  sessionId: number
  courseName: string
  date: string
  time: string
  studentId: number
  studentName: string
  status: "present" | "absent"
  branch: string
}

export function AttendanceReports() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch all sessions for reports
  const fetchAllSessions = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get("/api/session");
      console.log("Fetched sessions:", response.data)
      if (Array.isArray(response.data)) {
        setSessions(response.data)
        generateAttendanceRecords(response.data)
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate attendance records from sessions
  const generateAttendanceRecords = (sessionsData: Session[]) => {
    const records: AttendanceRecord[] = []

    sessionsData.forEach((session) => {
      // Add present students
      session.present.forEach((student) => {
        records.push({
          sessionId: session.id,
          courseName: session.courseName,
          date: session.date,
          time: session.time,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          status: "present",
          branch: student.branch,
        })
      })

      // Add absent students
      session.absent.forEach((student) => {
        records.push({
          sessionId: session.id,
          courseName: session.courseName,
          date: session.date,
          time: session.time,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          status: "absent",
          branch: student.branch,
        })
      })
    })

    setAttendanceRecords(records)
  }

  useEffect(() => {
    fetchAllSessions()
  }, [])

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.courseName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCourse = selectedCourse === "all" || record.courseName === selectedCourse
    const matchesBranch = selectedBranch === "all" || record.branch === selectedBranch
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus

    const matchesDateRange =
      (!dateFrom || new Date(record.date) >= new Date(dateFrom)) &&
      (!dateTo || new Date(record.date) <= new Date(dateTo))

    return matchesSearch && matchesCourse && matchesBranch && matchesStatus && matchesDateRange
  })

  // Calculate statistics
  const stats = {
    totalSessions: sessions.length,
    totalRecords: attendanceRecords.length,
    totalPresent: attendanceRecords.filter((r) => r.status === "present").length,
    totalAbsent: attendanceRecords.filter((r) => r.status === "absent").length,
    uniqueStudents: new Set(attendanceRecords.map((r) => r.studentId)).size,
    averageAttendance:
      attendanceRecords.length > 0
        ? Math.round((attendanceRecords.filter((r) => r.status === "present").length / attendanceRecords.length) * 100)
        : 0,
  }

  // Get unique courses and branches for filters
  const uniqueCourses = [...new Set(sessions.map((s) => s.courseName))]
  const uniqueBranches = [
    ...new Set([
      ...sessions.flatMap((s) => s.present.map((st) => st.branch)),
      ...sessions.flatMap((s) => s.absent.map((st) => st.branch)),
    ]),
  ]

  // Course-wise statistics
  const courseStats = uniqueCourses.map((course) => {
    const courseRecords = attendanceRecords.filter((r) => r.courseName === course)
    const present = courseRecords.filter((r) => r.status === "present").length
    const total = courseRecords.length
    return {
      course,
      total,
      present,
      absent: total - present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })

  // Branch-wise statistics
  const branchStats = uniqueBranches.map((branch) => {
    const branchRecords = attendanceRecords.filter((r) => r.branch === branch)
    const present = branchRecords.filter((r) => r.status === "present").length
    const total = branchRecords.length
    return {
      branch,
      total,
      present,
      absent: total - present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })

  const handleExportReport = () => {
    const csvContent = generateReportCSV()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateReportCSV = () => {
    let csv = ""

    // Summary
    csv += "Attendance Report Summary\n"
    csv += `Generated Date,${new Date().toLocaleDateString()}\n`
    csv += `Total Sessions,${stats.totalSessions}\n`
    csv += `Total Records,${stats.totalRecords}\n`
    csv += `Total Present,${stats.totalPresent}\n`
    csv += `Total Absent,${stats.totalAbsent}\n`
    csv += `Average Attendance Rate,${stats.averageAttendance}%\n`
    csv += "\n"

    // Detailed Records
    csv += "Detailed Attendance Records\n"
    csv += "Session ID,Course,Date,Time,Student ID,Student Name,Status,Branch\n"
    filteredRecords.forEach((record) => {
      csv += `${record.sessionId},"${record.courseName}","${new Date(record.date).toLocaleDateString()}","${record.time}",${record.studentId},"${record.studentName}","${record.status}","${record.branch}"\n`
    })

    return csv
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
          <p className="text-gray-600 text-lg">Comprehensive attendance analytics and detailed reporting</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl" onClick={fetchAllSessions} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button variant="outline" className="rounded-xl">
            <BarChart3 className="w-4 h-4 mr-2" />
            Advanced Analytics
          </Button>
          <Button
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl"
            onClick={handleExportReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalRecords}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Present</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalPresent}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Absent</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalAbsent}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Students</p>
                <p className="text-3xl font-bold text-orange-600">{stats.uniqueStudents}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
                <p className="text-3xl font-bold text-teal-600">{stats.averageAttendance}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">Report Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueBranches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                onClick={() => {
                  // Filters are applied automatically through state
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg px-6">
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="rounded-lg px-6">
            Detailed Records
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-6">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course-wise Statistics */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Course-wise Attendance
                </h3>
                <div className="space-y-4">
                  {courseStats.map((stat) => (
                    <div key={stat.course} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{stat.course}</h4>
                        <Badge
                          variant="outline"
                          className={
                            stat.rate >= 80
                              ? "border-green-200 text-green-800 bg-green-50"
                              : stat.rate >= 60
                                ? "border-yellow-200 text-yellow-800 bg-yellow-50"
                                : "border-red-200 text-red-800 bg-red-50"
                          }
                        >
                          {stat.rate}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-bold">{stat.total}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Present</p>
                          <p className="font-bold text-green-600">{stat.present}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Absent</p>
                          <p className="font-bold text-red-600">{stat.absent}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              stat.rate >= 80 ? "bg-green-500" : stat.rate >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${stat.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Branch-wise Statistics */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Branch-wise Attendance
                </h3>
                <div className="space-y-4">
                  {branchStats.map((stat) => (
                    <div key={stat.branch} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{stat.branch}</h4>
                        <Badge
                          variant="outline"
                          className={
                            stat.rate >= 80
                              ? "border-green-200 text-green-800 bg-green-50"
                              : stat.rate >= 60
                                ? "border-yellow-200 text-yellow-800 bg-yellow-50"
                                : "border-red-200 text-red-800 bg-red-50"
                          }
                        >
                          {stat.rate}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-bold">{stat.total}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Present</p>
                          <p className="font-bold text-green-600">{stat.present}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Absent</p>
                          <p className="font-bold text-red-600">{stat.absent}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              stat.rate >= 80 ? "bg-green-500" : stat.rate >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${stat.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Detailed Attendance Records
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Report
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={handleExportReport}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold">Session ID</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Time</TableHead>
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Branch</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-purple-600">#{record.sessionId}</TableCell>
                        <TableCell className="font-medium">{record.courseName}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-gray-500">ID: {record.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {record.branch}
                          </Badge>
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

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Attendance Trends</h3>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Advanced analytics charts coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Performance Insights</h3>
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Detailed insights dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
