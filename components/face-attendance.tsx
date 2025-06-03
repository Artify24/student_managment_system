"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Camera, Play, Square, Settings, Users, CheckCircle, AlertCircle, Pause, UserPlus, Clock } from "lucide-react"
import { useAppContext } from "@/lib/context"

interface AttendanceRecord {
  id: string
  name: string
  confidence: number
  status: string
  time: string
  photo?: string
  method: "auto" | "manual"
}

const availableStudents = [
  { id: "STU001", name: "Alice Johnson" },
  { id: "STU002", name: "Bob Smith" },
  { id: "STU003", name: "Carol Davis" },
  { id: "STU004", name: "David Wilson" },
  { id: "STU005", name: "Eva Brown" },
  { id: "STU006", name: "Frank Miller" },
  { id: "STU007", name: "Grace Lee" },
  { id: "STU008", name: "Henry Chen" },
]

export function FaceAttendance() {
  const { sessions, activeSession, setActiveSession } = useAppContext()
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedSession, setSelectedSession] = useState(activeSession)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentRecognition, setCurrentRecognition] = useState<string | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [autoStopTimer, setAutoStopTimer] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Update selected session when activeSession changes
  useEffect(() => {
    if (activeSession) {
      setSelectedSession(activeSession)
    }
  }, [activeSession])

  // Get available sessions (scheduled and ongoing)
  const availableSessions = sessions.filter((s) => s.status === "scheduled" || s.status === "ongoing")

  // Start webcam with simplified approach
  const startWebcam = async () => {
    setIsLoading(true)
    setCameraError(null)

    try {
      // Simple camera request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsActive(true)
      setIsPaused(false)
      console.log("Camera started successfully")
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError("Camera access denied or not available. Please check permissions.")
    } finally {
      setIsLoading(false)
    }
  }

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setIsPaused(false)
    setCameraError(null)
    if (autoStopTimer) {
      clearTimeout(autoStopTimer)
      setAutoStopTimer(null)
    }
  }

  // Pause webcam
  const pauseWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false
      })
    }
    setIsPaused(true)
  }

  // Resume webcam
  const resumeWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true
      })
    }
    setIsPaused(false)
  }

  // Capture photo
  const capturePhoto = (): string => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        return canvas.toDataURL("image/jpeg", 0.8)
      }
    }
    return ""
  }

  // Add manual attendance
  const addManualAttendance = () => {
    if (!selectedStudentId) {
      alert("Please select a student")
      return
    }

    const student = availableStudents.find((s) => s.id === selectedStudentId)
    if (!student) return

    // Check if student already marked present
    const existingRecord = attendanceRecords.find((r) => r.id === student.id)
    if (existingRecord) {
      alert("Student already marked present")
      return
    }

    const newRecord: AttendanceRecord = {
      id: student.id,
      name: student.name,
      confidence: 100,
      status: "present",
      time: new Date().toLocaleTimeString(),
      method: "manual",
    }

    setAttendanceRecords((prev) => [newRecord, ...prev])
    setSelectedStudentId("")
    setIsManualDialogOpen(false)
  }

  // Simulate student recognition and auto-stop
  const simulateRecognition = () => {
    const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)]
    const confidence = Math.floor(Math.random() * 20) + 80 // 80-100%

    // Check if student already marked present
    const existingRecord = attendanceRecords.find((r) => r.id === randomStudent.id)
    if (existingRecord) return

    const photo = capturePhoto()

    const newRecord: AttendanceRecord = {
      id: randomStudent.id,
      name: randomStudent.name,
      confidence,
      status: "present",
      time: new Date().toLocaleTimeString(),
      photo,
      method: "auto",
    }

    setAttendanceRecords((prev) => [newRecord, ...prev])
    setCurrentRecognition(randomStudent.name)

    // Auto-pause after recognition
    setTimeout(() => {
      pauseWebcam()
      setCurrentRecognition(null)
    }, 2000)
  }

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && selectedSession && !isPaused) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, selectedSession, isPaused])

  // Auto recognition simulation
  useEffect(() => {
    if (isActive && !isPaused && selectedSession) {
      const timeout = setTimeout(
        () => {
          if (Math.random() > 0.4) {
            // 60% chance of recognition
            simulateRecognition()
          }
        },
        Math.random() * 5000 + 3000,
      ) // 3-8 seconds

      setAutoStopTimer(timeout)
      return () => clearTimeout(timeout)
    }
  }, [isActive, isPaused, selectedSession, attendanceRecords.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartSession = async () => {
    if (!selectedSession) {
      alert("Please select a session first")
      return
    }
    await startWebcam()
    setSessionDuration(0)
    setAttendanceRecords([])
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Attendance</h1>
          <p className="text-gray-600">AI-powered real-time attendance tracking</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Manual Attendance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student">Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents
                        .filter((student) => !attendanceRecords.find((r) => r.id === student.id))
                        .map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.id})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={addManualAttendance}>
                  Mark Present
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-xl">
            <Settings className="w-4 h-4 mr-2" />
            Camera Settings
          </Button>
        </div>
      </div>

      {/* Session Selection */}
      <Card className="mb-8 rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Session</label>
                <Select
                  value={selectedSession?.id || ""}
                  onValueChange={(value) => {
                    const session = availableSessions.find((s) => s.id === value)
                    setSelectedSession(session || null)
                    setActiveSession(session || null)
                  }}
                >
                  <SelectTrigger className="w-64 rounded-xl">
                    <SelectValue placeholder="Choose a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {session.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSession && (
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Class:</strong> {selectedSession.class}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedSession.time}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      variant="outline"
                      className={
                        selectedSession.status === "ongoing"
                          ? "border-blue-200 text-blue-800 bg-blue-50"
                          : "border-orange-200 text-orange-800 bg-orange-50"
                      }
                    >
                      {selectedSession.status}
                    </Badge>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isActive ? (
                <Button
                  onClick={handleStartSession}
                  disabled={!selectedSession || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {isPaused ? (
                    <Button onClick={resumeWebcam} className="bg-green-600 hover:bg-green-700 rounded-xl">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pauseWebcam} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={stopWebcam} className="bg-red-600 hover:bg-red-700 rounded-xl">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] rounded-2xl border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0 h-full relative">
              {isActive && !cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 right-4">
                    <div className="flex justify-between items-center">
                      <Badge className={`${isPaused ? "bg-orange-500" : "bg-green-500"} text-white animate-pulse`}>
                        {isPaused ? "PAUSED" : "LIVE"}
                      </Badge>
                      <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                        {formatTime(sessionDuration)}
                      </div>
                    </div>
                  </div>

                  {/* Recognition Overlay */}
                  {currentRecognition && (
                    <div className="absolute top-16 left-4 right-4">
                      <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Student Recognized: {currentRecognition}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Status */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black bg-opacity-50 text-white p-3 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span>{isPaused ? "Camera Paused" : "Scanning for faces..."}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${isPaused ? "bg-orange-500" : "bg-green-500 animate-pulse"}`}
                          ></div>
                          <span className="text-sm">{isPaused ? "Paused" : "AI Processing"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    {cameraError ? (
                      <>
                        <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                        <p className="text-red-400 text-lg mb-2">Camera Error</p>
                        <p className="text-gray-500 mb-4">{cameraError}</p>
                        <p className="text-sm text-gray-400 mb-4">
                          You can still use manual attendance entry while camera is unavailable
                        </p>
                        <Button onClick={() => setCameraError(null)} variant="outline" className="rounded-xl">
                          Try Again
                        </Button>
                      </>
                    ) : isLoading ? (
                      <>
                        <div className="w-24 h-24 mx-auto mb-4 animate-spin rounded-full border-4 border-gray-600 border-t-purple-600" />
                        <p className="text-gray-400 text-lg">Starting Camera...</p>
                        <p className="text-gray-500">Please allow camera access when prompted</p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">Camera Inactive</p>
                        <p className="text-gray-500 mb-4">Select a session and click "Start Camera"</p>
                        <p className="text-sm text-gray-400">Or use manual attendance entry</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Log */}
        <div>
          <Card className="h-[600px] rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Session Attendance
                {selectedSession && (
                  <Badge variant="outline" className="ml-2">
                    {selectedSession.class}
                  </Badge>
                )}
              </h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {attendanceRecords.map((record, index) => (
                  <div key={index} className="p-4 border rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{record.name}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Present
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            record.method === "auto"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }
                        >
                          {record.method === "auto" ? "Auto" : "Manual"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>ID: {record.id}</p>
                      <p>Confidence: {record.confidence}%</p>
                      <p>Time: {record.time}</p>
                    </div>
                    {record.photo && (
                      <div className="mt-2">
                        <img
                          src={record.photo || "/placeholder.svg"}
                          alt="Captured"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {attendanceRecords.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No attendance recorded yet</p>
                    <p className="text-sm text-gray-400">
                      {selectedSession ? "Start the camera or use manual entry" : "Select a session first"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students Present</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto Detected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter((r) => r.method === "auto").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Manual Entry</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter((r) => r.method === "manual").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Session Duration</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(sessionDuration)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
