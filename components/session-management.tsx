"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Eye, Edit, Download, Clock } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/lib/context"

export function SessionManagement() {
  const { sessions, setSessions, setActiveSession, setActiveModule } = useAppContext()
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    class: "",
    date: "",
    time: "",
    duration: "",
  })

  const filteredSessions = sessions.filter((session) => {
    return selectedStatus === "all" || session.status === selectedStatus
  })

  const handleCreateSession = () => {
    if (!formData.title || !formData.class || !formData.date || !formData.time || !formData.duration) {
      alert("Please fill in all fields")
      return
    }

    const newSession = {
      id: `SES${String(sessions.length + 1).padStart(3, "0")}`,
      title: formData.title,
      class: formData.class,
      date: formData.date,
      time: formData.time,
      duration: `${formData.duration} hours`,
      enrolled: Math.floor(Math.random() * 30) + 15, // Random enrolled count
      attended: 0,
      status: "scheduled",
    }

    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)
    setFormData({ title: "", class: "", date: "", time: "", duration: "" })
    setIsDialogOpen(false)

    // Auto-navigate to face attendance with the new session
    setActiveSession(newSession)
    setActiveModule("face-attendance")
  }

  const handleStartAttendance = (session) => {
    // Update session status to ongoing
    const updatedSessions = sessions.map((s) => (s.id === session.id ? { ...s, status: "ongoing" } : s))
    setSessions(updatedSessions)

    // Set as active session and navigate to face attendance
    setActiveSession({ ...session, status: "ongoing" })
    setActiveModule("face-attendance")
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
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input
                  id="sessionTitle"
                  placeholder="Advanced Algorithms"
                  className="rounded-xl"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sessionClass">Class</Label>
                <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CS-101">CS-101</SelectItem>
                    <SelectItem value="CS-201">CS-201</SelectItem>
                    <SelectItem value="MATH-201">MATH-201</SelectItem>
                    <SelectItem value="PHYS-301">PHYS-301</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionDate">Date</Label>
                  <Input
                    id="sessionDate"
                    type="date"
                    className="rounded-xl"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
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
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="2"
                  className="rounded-xl"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={handleCreateSession}>
                Create Session & Start Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
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
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.id}</TableCell>
                  <TableCell>{session.title}</TableCell>
                  <TableCell>{session.class}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{session.date}</span>
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span>{session.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">
                        {session.attended}/{session.enrolled}
                      </span>
                      <div className="text-gray-500">
                        {session.enrolled > 0 ? Math.round((session.attended / session.enrolled) * 100) : 0}% rate
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        session.status === "completed"
                          ? "border-green-200 text-green-800 bg-green-50"
                          : session.status === "ongoing"
                            ? "border-blue-200 text-blue-800 bg-blue-50"
                            : "border-orange-200 text-orange-800 bg-orange-50"
                      }
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                      {(session.status === "scheduled" || session.status === "ongoing") && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 rounded-lg text-xs px-3"
                          onClick={() => handleStartAttendance(session)}
                        >
                          {session.status === "scheduled" ? "Start Attendance" : "Continue"}
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
