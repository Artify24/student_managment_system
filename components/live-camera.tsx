"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Video, VideoOff, CheckCircle, AlertCircle } from 'lucide-react'

interface LiveCameraProps {
  onRecognitionDetected?: (studentName: string, photo: string, confidence: number) => void
  sessionEnded?: boolean
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

export function LiveCamera({ onRecognitionDetected, sessionEnded = false }: LiveCameraProps) {
  // Camera and session states
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentRecognition, setCurrentRecognition] = useState<string | null>(null)
  const [autoStopCountdown, setAutoStopCountdown] = useState<number | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startWebcam = async () => {
    setIsLoading(true)
    setCameraError(null)

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.",
        )
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
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      // Try each configuration until one works
      for (const config of cameraConfigs) {
        try {
          console.log("Trying camera config:", config)
          stream = await navigator.mediaDevices.getUserMedia(config)
          console.log("Camera config successful:", config)
          break
        } catch (error: any) {
          console.log("Camera config failed:", config, error.message)
          lastError = error
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error("Failed to access camera with any configuration")
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Set up video event handlers
        const video = videoRef.current

        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded")
          console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight)

          video
            .play()
            .then(() => {
              console.log("Video playback started successfully")
              setIsActive(true)
              setIsPaused(false)
              setIsLoading(false)

              // Start 10-second countdown
              setAutoStopCountdown(10)

              // Start countdown timer
              countdownTimer.current = setInterval(() => {
                setAutoStopCountdown((prev) => {
                  if (prev === null || prev <= 1) {
                    // Auto stop after 10 seconds
                    stopWebcam()
                    return null
                  }
                  return prev - 1
                })
              }, 1000)
            })
            .catch((playError) => {
              console.error("Video play error:", playError)
              setCameraError("Failed to start video playback. Please try again.")
              setIsLoading(false)
            })
        }

        const handleVideoError = (e: Event) => {
          console.error("Video element error:", e)
          setCameraError("Video element encountered an error")
          setIsLoading(false)
        }

        const handleVideoLoadError = () => {
          console.error("Video failed to load")
          setCameraError("Failed to load video stream")
          setIsLoading(false)
        }

        // Add event listeners
        video.addEventListener("loadedmetadata", handleLoadedMetadata)
        video.addEventListener("error", handleVideoError)
        video.addEventListener("abort", handleVideoLoadError)

        // Cleanup function for event listeners
        const cleanup = () => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleVideoError)
          video.removeEventListener("abort", handleVideoLoadError)
        }

        // Set a timeout in case metadata never loads
        const metadataTimeout = setTimeout(() => {
          cleanup()
          setCameraError("Camera initialization timed out. Please try again.")
          setIsLoading(false)
        }, 10000) // 10 second timeout

        // Clear timeout when metadata loads
        video.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(metadataTimeout)
            cleanup()
          },
          { once: true },
        )
      } else {
        throw new Error("Video element not found")
      }
    } catch (error: any) {
      console.error("Camera error:", error)
      setIsLoading(false)

      let errorMessage = "Camera access failed. "

      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow camera access in your browser and try again."
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera found. Please connect a camera and try again."
      } else if (error.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application. Please close other apps using the camera."
      } else if (error.name === "OverconstrainedError") {
        errorMessage += "Camera doesn't support the requested settings. Trying with basic settings..."
      } else if (error.name === "SecurityError") {
        errorMessage += "Camera access blocked due to security settings."
      } else if (error.name === "TypeError") {
        errorMessage += "Camera API not supported in this browser."
      } else {
        errorMessage += error.message || "Unknown camera error occurred."
      }

      setCameraError(errorMessage)
      alert(`Camera Error: ${errorMessage}`)
    }
  }

  const stopWebcam = () => {
    console.log("Stopping webcam...")

    // Clear all timers
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current)
      autoStopTimer.current = null
    }
    if (recognitionTimer.current) {
      clearTimeout(recognitionTimer.current)
      recognitionTimer.current = null
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("Camera track stopped:", track.label)
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    setIsPaused(false)
    setCameraError(null)
    setAutoStopCountdown(null)
    setCurrentRecognition(null)

    console.log("Camera stopped successfully")
  }

  const pauseWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false
      })
    }
    setIsPaused(true)

    // Clear countdown when paused
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
    setAutoStopCountdown(null)

    console.log("Camera paused")
  }

  const resumeWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true
      })
    }
    setIsPaused(false)
    console.log("Camera resumed")
  }

  const capturePhoto = (): string => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        // Capture the actual video frame without flipping for storage
        context.drawImage(video, 0, 0)
        return canvas.toDataURL("image/jpeg", 0.9)
      }
    }
    return ""
  }

  const simulateRecognition = async () => {
    const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)]
    const confidence = Math.floor(Math.random() * 20) + 80

    const photo = capturePhoto()

    setCurrentRecognition(randomStudent.name)

    // Notify parent component
    onRecognitionDetected?.(randomStudent.name, photo, confidence)

    // Clear recognition after 3 seconds
    recognitionTimer.current = setTimeout(() => {
      setCurrentRecognition(null)
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartSession = async () => {
    await startWebcam()
    setSessionDuration(0)
  }

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && !isPaused && !sessionEnded) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, isPaused, sessionEnded])

  // Auto recognition simulation
  useEffect(() => {
    if (isActive && !isPaused && !sessionEnded && autoStopCountdown === null) {
      const timeout = setTimeout(
        () => {
          if (Math.random() > 0.5) {
            simulateRecognition()
          }
        },
        Math.random() * 4000 + 2000,
      )

      autoStopTimer.current = timeout
      return () => clearTimeout(timeout)
    }
  }, [isActive, isPaused, sessionEnded, autoStopCountdown])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current)
      }
      if (autoStopTimer.current) {
        clearTimeout(autoStopTimer.current)
      }
      if (recognitionTimer.current) {
        clearTimeout(recognitionTimer.current)
      }
    }
  }, [])

  return (
    <Card className="h-[600px] rounded-2xl border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {isActive && !cameraError && !sessionEnded ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: "scaleX(-1)", // Mirror for user comfort
                filter: isPaused ? "grayscale(100%)" : "none",
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Status Overlay */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge className={`${isPaused ? "bg-orange-500" : "bg-red-500"} text-white animate-pulse`}>
                    {isPaused ? "PAUSED" : "● LIVE"}
                  </Badge>
                  {streamRef.current && (
                    <Badge className="bg-blue-500 text-white">
                      {streamRef.current.getVideoTracks()[0]?.getSettings()?.frameRate || 30} FPS
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {autoStopCountdown !== null && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold animate-pulse">
                      Auto Stop: {autoStopCountdown}s
                    </div>
                  )}
                  <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                    {formatTime(sessionDuration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recognition Alert */}
            {currentRecognition && (
              <div className="absolute top-20 left-4 right-4">
                <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">✨ Student Recognized: {currentRecognition}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-70 text-white p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <span>
                    {isPaused
                      ? "📹 Camera Paused - Click Resume to continue"
                      : autoStopCountdown !== null
                        ? `⏱️ Auto-stopping in ${autoStopCountdown} seconds...`
                        : "🔍 Live scanning for faces..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isPaused ? "bg-orange-500" : "bg-green-500 animate-pulse"}`}
                    ></div>
                    <span className="text-sm">{isPaused ? "Paused" : "AI Active"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Quality Info */}
            {videoRef.current && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-black bg-opacity-50 text-white">
                  {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
                </Badge>
              </div>
            )}

            {/* Camera Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
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
                <VideoOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center max-w-md">
              {sessionEnded ? (
                <>
                  <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
                  <p className="text-green-400 text-lg mb-2">Session Completed</p>
                  <p className="text-gray-400 mb-4">Attendance data has been saved successfully</p>
                </>
              ) : cameraError ? (
                <>
                  <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 text-lg mb-2">Camera Error</p>
                  <p className="text-gray-500 mb-4 text-sm">{cameraError}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-400">Troubleshooting tips:</p>
                    <ul className="text-xs text-gray-500 space-y-1 text-left">
                      <li>• Allow camera permissions when prompted</li>
                      <li>• Close other apps using the camera</li>
                      <li>• Try refreshing the page</li>
                      <li>• Use Chrome, Firefox, or Safari browser</li>
                    </ul>
                  </div>
                  <Button onClick={() => setCameraError(null)} variant="outline" className="rounded-xl">
                    Try Again
                  </Button>
                </>
              ) : isLoading ? (
                <>
                  <div className="w-24 h-24 mx-auto mb-4 animate-spin rounded-full border-4 border-gray-600 border-t-purple-600" />
                  <p className="text-gray-400 text-lg">Starting Live Camera...</p>
                  <p className="text-gray-500 mb-2">Please allow camera access when prompted</p>
                  <div className="text-sm text-gray-400">
                    <p>Initializing camera with optimal settings...</p>
                  </div>
                </>
              ) : (
                <>
                  <Video className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Live Camera Ready</p>
                  <p className="text-gray-500 mb-4">Click "Start Live Camera" to begin real-time attendance</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>📹 High-quality live preview</p>
                    <p>⏱️ Auto-stop after 10 seconds</p>
                    <p>🔍 Real-time face detection</p>
                  </div>
                  <Button
                    onClick={handleStartSession}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 rounded-xl mt-4"
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
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
