"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Eye, Edit, Download, Clock, Users, UserCheck, UserX } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { useAppContext } from "@/lib/context"

export function SessionManagement() {
  const [sessions, setsessions] = useState<any[]>([])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const { setActiveModule, setActiveSession } = useAppContext()

  console.log("Sessions:", sessions)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("/api/session/today")
        const data = response
        console.log("Fetched sessions:", data.data)
        // Ensure data is an array
        if (Array.isArray(data.data)) {
          setsessions(data.data)
        } else {
          console.warn("API response is not an array:", data)
          setsessions([])
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      }
    }

    fetchSessions()
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    class: "",
    time: "",
  })

  const filteredSessions = Array.isArray(sessions)
    ? sessions.filter((session) => {
        if (selectedStatus === "all") return true
        if (selectedStatus === "active") return session.status === true
        if (selectedStatus === "completed") return session.status === false
        return true
      })
    : []

  const handleCreateSession = async () => {
    if (!formData.class || !formData.time) {
      alert("Please fill in all fields")
      return
    }
    setIsDialogOpen(false)

    try {
      const response = await axios.post("/api/session", {
        courseName: formData.class,
        time: formData.time,
      })
      const newSession = response.data
      console.log("New session created:", newSession)

      try {
        const updatedResponse = await axios.get("/api/session/today")
        const updatedData = updatedResponse.data
        if (Array.isArray(updatedData)) {
          setsessions(updatedData)
        }
      } catch (fetchError) {
        console.error("Error fetching updated sessions:", fetchError)
      }

      // Close dialog and reset form
      setFormData({ class: "", time: "" })
    } catch (error) {
      console.error("Error creating session:", error)
      alert("Error creating session")
    }
  }

  const handleStartAttendance = (session: any) => {
    // This function can be implemented based on your navigation logic
    console.log("Starting attendance for session:", session)
    setActiveSession(session)
    setActiveModule("face-attendance")
  }

  const handleViewSession = (session: any) => {
    setSelectedSession(session)
    setIsViewDialogOpen(true)
  }

  const handleDownloadExcel = (session: any) => {
    // Create Excel-like data structure
    const excelData = {
      sessionInfo: {
        id: session.id,
        courseName: session.courseName,
        date: session.date,
        time: session.time,
        status: session.status,
      },
      presentStudents: session.present || [],
      absentStudents: session.absent || [],
    }

    // Convert to CSV format for Excel compatibility
    const csvContent = generateCSV(excelData)

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `session_${session.id}_${session.courseName}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateCSV = (data: any) => {
    let csv = ""

    // Session Info
    csv += "Session Information\n"
    csv += `Session ID,${data.sessionInfo.id}\n`
    csv += `Course Name,${data.sessionInfo.courseName}\n`
    csv += `Date,${new Date(data.sessionInfo.date).toLocaleDateString()}\n`
    csv += `Time,${data.sessionInfo.time}\n`
    csv += `Status,${data.sessionInfo.status ? "Active" : "Completed"}\n`
    csv += "\n"

    // Present Students
    csv += "Present Students\n"
    csv += "ID,First Name,Last Name,Email,Address,Branch,Attendance,Absent,Fees Paid,Fees Amount,Created At\n"
    data.presentStudents.forEach((student: any) => {
      csv += `${student.id},${student.firstName},${student.lastName},${student.email},${student.address},${student.branch},${student.attendance},${student.absent},${student.feesPaid},${student.feesAmount},${new Date(student.createdAt).toLocaleDateString()}\n`
    })
    csv += "\n"

    // Absent Students
    csv += "Absent Students\n"
    csv += "ID,First Name,Last Name,Email,Address,Branch,Attendance,Absent,Fees Paid,Fees Amount,Created At\n"
    data.absentStudents.forEach((student: any) => {
      csv += `${student.id},${student.firstName},${student.lastName},${student.email},${student.address},${student.branch},${student.attendance},${student.absent},${student.feesPaid},${student.feesAmount},${new Date(student.createdAt).toLocaleDateString()}\n`
    })

    return csv
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusDisplay = (status: boolean) => {
    return status ? "Active" : "Completed"
  }

  const getStatusBadgeClass = (status: boolean) => {
    return status ? "border-blue-200 text-blue-800 bg-blue-50" : "border-green-200 text-green-800 bg-green-50"
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sessions</h1>
          <p className="text-gray-600">Create, schedule, and manage class sessions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionClass">Courses</Label>
                <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Maths">Maths</SelectItem>
                    <SelectItem value="Data Structures and Algorithms">Data Structures and Algorithms</SelectItem>
                    <SelectItem value="Operating Systems">Operating Systems</SelectItem>
                    <SelectItem value="Database Management Systems">Database Management Systems</SelectItem>
                    <SelectItem value="Computer Networks">Computer Networks</SelectItem>
                    <SelectItem value="Graphics">Graphics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTime">Time</Label>
                  <Input
                    id="sessionTime"
                    type="time"
                    className="rounded-xl"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={handleCreateSession}>
                Create Session & Start Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Session Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Session Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Session ID:</strong> {selectedSession.id}
                    </div>
                    <div>
                      <strong>Course:</strong> {selectedSession.courseName}
                    </div>
                    <div>
                      <strong>Date:</strong> {formatDate(selectedSession.date)}
                    </div>
                    <div>
                      <strong>Time:</strong> {selectedSession.time}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge className={`ml-2 ${getStatusBadgeClass(selectedSession.status)}`}>
                        {getStatusDisplay(selectedSession.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Present Students */}
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    Present Students ({selectedSession.present?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedSession.present?.map((student: any) => (
                      <div key={student.id} className="border rounded-lg p-3 bg-green-50">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>ID:</strong> {student.id}
                          </div>
                          <div>
                            <strong>Name:</strong> {student.firstName} {student.lastName}
                          </div>
                          <div>
                            <strong>Email:</strong> {student.email}
                          </div>
                          <div>
                            <strong>Branch:</strong> {student.branch}
                          </div>
                          <div>
                            <strong>Address:</strong> {student.address}
                          </div>
                          <div>
                            <strong>Attendance:</strong> {student.attendance}
                          </div>
                          <div>
                            <strong>Fees Paid:</strong> {student.feesPaid ? "Yes" : "No"}
                          </div>
                          <div>
                            <strong>Fees Amount:</strong> ₹{student.feesAmount}
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No present students</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Absent Students */}
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    Absent Students ({selectedSession.absent?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedSession.absent?.map((student: any) => (
                      <div key={student.id} className="border rounded-lg p-3 bg-red-50">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>ID:</strong> {student.id}
                          </div>
                          <div>
                            <strong>Name:</strong> {student.firstName} {student.lastName}
                          </div>
                          <div>
                            <strong>Email:</strong> {student.email}
                          </div>
                          <div>
                            <strong>Branch:</strong> {student.branch}
                          </div>
                          <div>
                            <strong>Address:</strong> {student.address}
                          </div>
                          <div>
                            <strong>Absent Count:</strong> {student.absent}
                          </div>
                          <div>
                            <strong>Fees Paid:</strong> {student.feesPaid ? "Yes" : "No"}
                          </div>
                          <div>
                            <strong>Fees Amount:</strong> ₹{student.feesAmount}
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No absent students</p>}
                  </div>
                </CardContent>
              </Card>

             
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Session Overview</h2>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="active" className="mb-6">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Session ID</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.id}</TableCell>
                  <TableCell>{session.courseName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(session.date)}</span>
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span>{session.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">Present: {session.present.length}</span>
                      <div className="text-gray-500">Absent: {session.absent.length}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadgeClass(session.status)}>
                      {getStatusDisplay(session.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 w-8 p-0"
                        onClick={() => handleViewSession(session)}
                        title="View session details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 w-8 p-0"
                        onClick={() => handleDownloadExcel(session)}
                        title="Download as Excel"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {session.status && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 rounded-lg text-xs px-3"
                          onClick={() => handleStartAttendance(session)}
                        >
                          Start Attendance
                        </Button>
                      )}
                    </div>
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
