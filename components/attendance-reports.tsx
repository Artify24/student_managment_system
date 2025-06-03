"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, TrendingUp, Filter } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const attendanceData = [
  {
    date: "2024-01-15",
    student: "Alice Johnson",
    class: "CS-101",
    session: "Advanced Algorithms",
    status: "present",
    time: "09:15 AM",
  },
  {
    date: "2024-01-15",
    student: "Bob Smith",
    class: "CS-101",
    session: "Advanced Algorithms",
    status: "present",
    time: "09:18 AM",
  },
  {
    date: "2024-01-15",
    student: "Carol Davis",
    class: "CS-101",
    session: "Advanced Algorithms",
    status: "late",
    time: "09:25 AM",
  },
  {
    date: "2024-01-15",
    student: "David Wilson",
    class: "MATH-201",
    session: "Linear Algebra",
    status: "absent",
    time: "-",
  },
  {
    date: "2024-01-14",
    student: "Eva Brown",
    class: "PHYS-301",
    session: "Physics Lab",
    status: "present",
    time: "02:05 PM",
  },
]

export function AttendanceReports() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredData = attendanceData.filter((record) => {
    const matchesClass = selectedClass === "all" || record.class === selectedClass
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus
    return matchesClass && matchesStatus
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Comprehensive attendance analytics and reporting</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8 rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">Report Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="CS-101">CS-101</SelectItem>
                  <SelectItem value="MATH-201">MATH-201</SelectItem>
                  <SelectItem value="PHYS-301">PHYS-301</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredData.filter((r) => r.status === "present").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredData.filter((r) => r.status === "late").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredData.filter((r) => r.status === "absent").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">Attendance Records</h2>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="font-medium">{record.student}</TableCell>
                  <TableCell>{record.class}</TableCell>
                  <TableCell>{record.session}</TableCell>
                  <TableCell>{record.time}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        record.status === "present"
                          ? "border-green-200 text-green-800 bg-green-50"
                          : record.status === "late"
                            ? "border-orange-200 text-orange-800 bg-orange-50"
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
        </CardContent>
      </Card>
    </div>
  )
}
