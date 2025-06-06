"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Play,
  Users,
  CheckCircle,
  AlertCircle,
  Pause,
  UserPlus,
  Clock,
  Save,
  X,
  Video,
  VideoOff,
} from "lucide-react";
import axios from "axios";
import { Input } from "@/components/ui/input";

interface AttendanceRecord {
  id: string;
  name: string;
  confidence: number;
  status: string;
  time: string;
  photo?: string;
  method: "auto" | "manual";
}

interface PresentStudent {
  id: string;
  name: string;
  method: "auto" | "manual";
  timestamp: string;
  confidence?: number;
  photo?: string;
}

interface FaceAttendanceProps {
  selectedSession?: any;
  onBackToSessions?: () => void;
}
import { useAppContext } from "@/lib/context";
import { LiveCamera } from "./live-camera";
const availableStudents = [
  { id: "STU001", name: "Alice Johnson" },
  { id: "STU002", name: "Bob Smith" },
  { id: "STU003", name: "Carol Davis" },
  { id: "STU004", name: "David Wilson" },
  { id: "STU005", name: "Eva Brown" },
  { id: "STU006", name: "Frank Miller" },
  { id: "STU007", name: "Grace Lee" },
  { id: "STU008", name: "Henry Chen" },
];

export function FaceAttendance({
  selectedSession,
  onBackToSessions,
}: FaceAttendanceProps) {
  // get active session
  const { activeSession } = useAppContext();
  // Camera and session states
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecognition, setCurrentRecognition] = useState<string | null>(
    null
  );
  const [autoStopCountdown, setAutoStopCountdown] = useState<number | null>(
    null
  );

  // Attendance states - optimized for better state management
  const [presentStudents, setPresentStudents] = useState<PresentStudent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  // UI states
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize attendance records from session data
  useEffect(() => {
    if (selectedSession && selectedSession.present) {
      const existingStudents = selectedSession.present.map(
        (student: any, index: number) => ({
          id: student.id || `STU00${index + 1}`,
          name: student.name || `Student ${index + 1}`,
          method: "auto" as const,
          timestamp: new Date().toISOString(),
          confidence: 95,
        })
      );

      setPresentStudents(existingStudents);

      const existingRecords = existingStudents.map(
        (student: PresentStudent) => ({
          id: student.id,
          name: student.name,
          confidence: student.confidence || 95,
          status: "present",
          time: new Date(student.timestamp).toLocaleTimeString(),
          method: student.method,
          photo: student.photo,
        })
      );

      setAttendanceRecords(existingRecords);
    }
  }, [selectedSession]);

  const startWebcam = async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari."
        );
      }

      // Try different camera configurations with fallbacks
      const cameraConfigs = [
        // High quality configuration
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: "user",
          },
          audio: false,
        },
        // Medium quality fallback
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15 },
            facingMode: "user",
          },
          audio: false,
        },
        // Basic fallback
        {
          video: {
            facingMode: "user",
          },
          audio: false,
        },
        // Simplest fallback
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      // Try each configuration until one works
      for (const config of cameraConfigs) {
        try {
          console.log("Trying camera config:", config);
          stream = await navigator.mediaDevices.getUserMedia(config);
          console.log("Camera config successful:", config);
          break;
        } catch (error: any) {
          console.log("Camera config failed:", config, error.message);
          lastError = error;
          continue;
        }
      }

      if (!stream) {
        throw (
          lastError ||
          new Error("Failed to access camera with any configuration")
        );
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Set up video event handlers
        const video = videoRef.current;

        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded");
          console.log(
            "Video dimensions:",
            video.videoWidth,
            "x",
            video.videoHeight
          );

          video
            .play()
            .then(() => {
              console.log("Video playback started successfully");
              setIsActive(true);
              setIsPaused(false);
              setIsLoading(false);

              // Start 10-second countdown
              setAutoStopCountdown(10);

              // Start countdown timer
              countdownTimer.current = setInterval(() => {
                setAutoStopCountdown((prev) => {
                  if (prev === null || prev <= 1) {
                    // Auto stop after 10 seconds
                    stopWebcam();
                    return null;
                  }
                  return prev - 1;
                });
              }, 1000);
            })
            .catch((playError) => {
              console.error("Video play error:", playError);
              setCameraError(
                "Failed to start video playback. Please try again."
              );
              setIsLoading(false);
            });
        };

        const handleVideoError = (e: Event) => {
          console.error("Video element error:", e);
          setCameraError("Video element encountered an error");
          setIsLoading(false);
        };

        const handleVideoLoadError = () => {
          console.error("Video failed to load");
          setCameraError("Failed to load video stream");
          setIsLoading(false);
        };

        // Add event listeners
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleVideoError);
        video.addEventListener("abort", handleVideoLoadError);

        // Cleanup function for event listeners
        const cleanup = () => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleVideoError);
          video.removeEventListener("abort", handleVideoLoadError);
        };

        // Set a timeout in case metadata never loads
        const metadataTimeout = setTimeout(() => {
          cleanup();
          setCameraError("Camera initialization timed out. Please try again.");
          setIsLoading(false);
        }, 10000); // 10 second timeout

        // Clear timeout when metadata loads
        video.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(metadataTimeout);
            cleanup();
          },
          { once: true }
        );
      } else {
        throw new Error("Video element not found");
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      setIsLoading(false);

      let errorMessage = "Camera access failed. ";

      if (error.name === "NotAllowedError") {
        errorMessage +=
          "Please allow camera access in your browser and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage +=
          "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage +=
          "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage +=
          "Camera doesn't support the requested settings. Trying with basic settings...";
      } else if (error.name === "SecurityError") {
        errorMessage += "Camera access blocked due to security settings.";
      } else if (error.name === "TypeError") {
        errorMessage += "Camera API not supported in this browser.";
      } else {
        errorMessage += error.message || "Unknown camera error occurred.";
      }

      setCameraError(errorMessage);
      alert(`Camera Error: ${errorMessage}`);
    }
  };

  const stopWebcam = () => {
    console.log("Stopping webcam...");

    // Clear all timers
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
    if (recognitionTimer.current) {
      clearTimeout(recognitionTimer.current);
      recognitionTimer.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Camera track stopped:", track.label);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsPaused(false);
    setCameraError(null);
    setAutoStopCountdown(null);
    setCurrentRecognition(null);

    console.log("Camera stopped successfully");
  };

  const pauseWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    setIsPaused(true);

    // Clear countdown when paused
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setAutoStopCountdown(null);

    console.log("Camera paused");
  };

  const resumeWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    }
    setIsPaused(false);
    console.log("Camera resumed");
  };

  const capturePhoto = (): string => {
    if (
      videoRef.current &&
      canvasRef.current &&
      videoRef.current.videoWidth > 0
    ) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        // Capture the actual video frame without flipping for storage
        context.drawImage(video, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9);
      }
    }
    return "";
  };

  const addStudentToPresent = (student: PresentStudent) => {
    // Check if student is already present
    const isAlreadyPresent = presentStudents.some((s) => s.id === student.id);
    if (isAlreadyPresent) {
      alert(`${student.name} is already marked as present.`);
      return false;
    }

    // Add to present students state
    setPresentStudents((prev) => [...prev, student]);

    // Add to attendance records for display
    const newRecord: AttendanceRecord = {
      id: student.id,
      name: student.name,
      confidence: student.confidence || 100,
      status: "present",
      time: new Date(student.timestamp).toLocaleTimeString(),
      photo: student.photo,
      method: student.method,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    return true;
  };

  const addManualAttendance = async () => {
    if (!selectedStudentId.trim()) {
      alert("Please enter a student ID");
      return;
    }

    // Find student by ID or create new entry
    let student = availableStudents.find(
      (s) => s.id === selectedStudentId.trim()
    );

    if (!student) {
      // If not found in available students, create a new entry with the provided ID
      student = {
        id: selectedStudentId.trim(),
        name: `Student ${selectedStudentId.trim()}`,
      };
    }

    const newStudent: PresentStudent = {
      id: student.id,
      name: student.name,
      method: "manual",
      timestamp: new Date().toISOString(),
      confidence: 100,
    };

    const success = addStudentToPresent(newStudent);

    if (success) {
      setSelectedStudentId("");
      setIsManualDialogOpen(false);
      alert(`${student.name} marked as present`);
    }
  };

  const simulateRecognition = async () => {
    const randomStudent =
      availableStudents[Math.floor(Math.random() * availableStudents.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;

    // Check if already present
    const isAlreadyPresent = presentStudents.some(
      (s) => s.id === randomStudent.id
    );
    if (isAlreadyPresent) return;

    const photo = capturePhoto();

    const newStudent: PresentStudent = {
      id: randomStudent.id,
      name: randomStudent.name,
      method: "auto",
      timestamp: new Date().toISOString(),
      confidence,
      photo,
    };

    addStudentToPresent(newStudent);
    setCurrentRecognition(randomStudent.name);

    // Clear recognition after 3 seconds
    recognitionTimer.current = setTimeout(() => {
      setCurrentRecognition(null);
    }, 3000);
  };

  const removeStudentFromPresent = (studentId: string) => {
    const student = presentStudents.find((s) => s.id === studentId);
    if (student && confirm(`Remove ${student.name} from present list?`)) {
      setPresentStudents((prev) => prev.filter((s) => s.id !== studentId));
      setAttendanceRecords((prev) => prev.filter((r) => r.id !== studentId));
      alert("Student removed from present list");
    }
  };

  const endSession = async () => {
    if (presentStudents.length === 0) {
      alert("No students are marked as present to save.");
      return;
    }

    if (
      !confirm(
        `End session and save attendance for ${presentStudents.length} students?`
      )
    ) {
      return;
    }

    setIsSavingSession(true);

    try {
      // Stop camera if active
      if (isActive) {
        stopWebcam();
      }

      // Prepare data for API
      const presentIds = presentStudents.map((s) => s.id);

      console.log("Ending session with present IDs:", presentIds);

      // Save to database
      const response = await axios.put(
        `http://localhost:3000/api/session/${activeSession?.id}/attendance`,
        { presentIds }
      );

      console.log("Session ended and attendance saved:", response.data);

      setSessionEnded(true);
      alert(
        `Session ended successfully! Attendance saved for ${presentStudents.length} students.`
      );

      // Optional: Navigate back to sessions after a delay
      setTimeout(() => {
        onBackToSessions?.();
      }, 2000);
    } catch (error) {
      console.error("Error ending session:", error);
      alert(
        "Error ending session. Failed to save attendance data. Please try again."
      );
    } finally {
      setIsSavingSession(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartSession = async () => {
    await startWebcam();
    setSessionDuration(0);
    setSessionEnded(false);
  };

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && !sessionEnded) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, sessionEnded]);

  // Auto recognition simulation
  useEffect(() => {
    if (isActive && !isPaused && !sessionEnded && autoStopCountdown === null) {
      const timeout = setTimeout(() => {
        if (Math.random() > 0.5) {
          simulateRecognition();
        }
      }, Math.random() * 4000 + 2000);

      autoStopTimer.current = timeout;
      return () => clearTimeout(timeout);
    }
  }, [
    isActive,
    isPaused,
    attendanceRecords.length,
    sessionEnded,
    autoStopCountdown,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
      if (autoStopTimer.current) {
        clearTimeout(autoStopTimer.current);
      }
      if (recognitionTimer.current) {
        clearTimeout(recognitionTimer.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Live Face Attendance
            </h1>
            <p className="text-gray-600">
              Real-time attendance tracking with live camera preview
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Dialog
            open={isManualDialogOpen}
            onOpenChange={setIsManualDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={sessionEnded}
              >
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
                  <Label htmlFor="student">Enter Student ID</Label>
                  <Input
                    placeholder="Enter student ID..."
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="rounded-xl"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addManualAttendance();
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl"
                  onClick={addManualAttendance}
                >
                  Mark Present
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* End Session Button */}
          <Button
            onClick={endSession}
            disabled={
              isSavingSession || sessionEnded || presentStudents.length === 0
            }
            className="bg-green-600 hover:bg-green-700 rounded-xl"
          >
            {isSavingSession ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                End Session
              </>
            )}
          </Button>

        </div>
      </div>

      {/* Session Status Alert */}
      {sessionEnded && (
        <Card className="mb-6 rounded-2xl border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Session Ended Successfully
                </p>
                <p className="text-sm text-green-600">
                  Attendance data for {presentStudents.length} students has been
                  saved to the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      <Card className="mb-8 rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeSession?.courseName || "Live Demo Session"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {activeSession?.time || new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isActive && !sessionEnded ? (
                <Button
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Start Live Camera
                    </>
                  )}
                </Button>
              ) : !sessionEnded ? (
                <>
                  {isPaused ? (
                    <Button
                      onClick={resumeWebcam}
                      className="bg-green-600 hover:bg-green-700 rounded-xl"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseWebcam}
                      className="bg-orange-600 hover:bg-orange-700 rounded-xl"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button
                    onClick={stopWebcam}
                    className="bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LiveCamera/>
        

        {/* Present Students List */}
        <div>
          <Card className="h-[600px] rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Present Students
                <Badge variant="outline" className="ml-2">
                  {presentStudents.length}
                </Badge>
              </h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {attendanceRecords.map((record, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-xl bg-gray-50 relative"
                  >
                    {!sessionEnded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudentFromPresent(record.id)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    )}

                    <div className="flex items-center justify-between mb-2 pr-8">
                      <span className="font-medium text-gray-900">
                        {record.name}
                      </span>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
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
                      Start the live camera or use manual entry
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
                <p className="text-2xl font-bold text-gray-900">
                  {presentStudents.length}
                </p>
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
                  {presentStudents.filter((s) => s.method === "auto").length}
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
                  {presentStudents.filter((s) => s.method === "manual").length}
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
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(sessionDuration)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
