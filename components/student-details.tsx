"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Save, X, User, Mail, MapPin, GraduationCap, DollarSign, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  address: string
  branch?: string
  courses?: string[]
  feesAmount?: number
  feesPaid?: boolean
  imageUrl?: string
  attendance?: number
  createdAt?: string
  status?: string
  class?: string
}

interface StudentDetailsProps {
  student: Student
  onBack: () => void
  onUpdate: (student: Student) => void
}

export function StudentDetails({ student, onBack, onUpdate }: StudentDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedStudent, setEditedStudent] = useState<Student>(student)
  const [fetchedStudent, setFetchedStudent] = useState<Student>(student)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(student.imageUrl || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Available courses for selection
  const availableCourses = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Data Structures and Algorithms",
    "Operating Systems",
    "Database Management Systems",
    "Computer Networks",
    "Graphics",
    "Biology",
    "Statistics",
    "Machine Learning",
    "Web Development",
  ]

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/students/${student.id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch student data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setFetchedStudent(data)
        setEditedStudent(data)
        setImagePreview(data.imageUrl || null)

        // Handle courses - whether they come as strings or objects, convert to strings
        let courseNames: string[] = []
        if (data.courses) {
          courseNames = data.courses
            .map((course: any) => {
              if (typeof course === "string") {
                return course
              } else if (course && course.name) {
                return course.name
              }
              return course
            })
            .filter(Boolean)
        }
        setSelectedCourses(courseNames)

        console.log("Fetched student data:", data)
        console.log("Extracted course names:", courseNames)
      } catch (error) {
        console.error("Error fetching student data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch student data")
        // Fallback to the student data passed as prop
        setFetchedStudent(student)
        setEditedStudent(student)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [student.id])

  const handleCourseToggle = (courseName: string) => {
    const updatedCourses = selectedCourses.includes(courseName)
      ? selectedCourses.filter((c) => c !== courseName)
      : [...selectedCourses, courseName]

    setSelectedCourses(updatedCourses)

    // Update the editedStudent with just the course names as strings
    setEditedStudent({
      ...editedStudent,
      courses: updatedCourses,
    })
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      setSelectedImage(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setEditedStudent({
      ...editedStudent,
      imageUrl: undefined,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSave = () => {
    let imageUrl = editedStudent.imageUrl

    if (selectedImage) {
      // Create a blob URL for the selected image
      imageUrl = URL.createObjectURL(selectedImage)
      console.log("New image URL created:", imageUrl)
    }

    const updatedStudent = {
      ...editedStudent,
      imageUrl,
      courses: selectedCourses, // Ensure courses are just strings
    }

    // Console log the new data as requested
    console.log("=== STUDENT UPDATE SUBMISSION ===")
    console.log("Updated student data:", updatedStudent)
    console.log("Original data:", fetchedStudent)
    console.log("Courses (strings only):", selectedCourses)
    console.log("Changes made:", {
      original: fetchedStudent,
      updated: updatedStudent,
      differences: Object.keys(updatedStudent).reduce(
        (diff, key) => {
          const typedKey = key as keyof Student
          const originalValue = fetchedStudent[typedKey]
          const updatedValue = updatedStudent[typedKey]

          if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
            diff[typedKey] = {
              from: originalValue,
              to: updatedValue,
            }
          }
          return diff
        },
        {} as Record<keyof Student, { from: any; to: any }>,
      ),
    })

    // Update the fetched student state to reflect the changes
    setFetchedStudent(updatedStudent)

    // This will trigger the API call in the parent component
    onUpdate(updatedStudent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedStudent(fetchedStudent)
    setSelectedImage(null)
    setImagePreview(fetchedStudent.imageUrl || null)

    // Reset selected courses from fetched data
    let courseNames: string[] = []
    if (fetchedStudent.courses) {
      courseNames = fetchedStudent.courses
        .map((course: any) => {
          if (typeof course === "string") {
            return course
          } else if (course && course.name) {
            return course.name
          }
          return course
        })
        .filter(Boolean)
    }
    setSelectedCourses(courseNames)

    setIsEditing(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const getAttendanceStatus = (attendance: number) => {
    if (attendance >= 90) return { color: "bg-green-500", status: "Excellent" }
    if (attendance >= 75) return { color: "bg-orange-500", status: "Good" }
    if (attendance >= 60) return { color: "bg-yellow-500", status: "Average" }
    return { color: "bg-red-500", status: "Poor" }
  }

  // Get display courses - handle both string and object formats
  const getDisplayCourses = (courses?: any[]) => {
    if (!courses || courses.length === 0) return []
    return courses
      .map((course: any) => {
        if (typeof course === "string") {
          return course
        } else if (course && course.name) {
          return course.name
        }
        return course
      })
      .filter(Boolean)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading student details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const attendanceInfo = getAttendanceStatus(fetchedStudent.attendance || 0)
  const displayCourses = getDisplayCourses(fetchedStudent.courses)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {fetchedStudent.firstName} {fetchedStudent.lastName}
            </h1>
            <p className="text-gray-600">Student ID: {fetchedStudent.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              Edit Student
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Photo */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={!isEditing}
              />

              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-gray-100"
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-xl"
                  onClick={triggerFileInput}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview ? "Change Photo" : "Upload Photo"}
                </Button>
              )}
            </div>

            <Separator />

            {/* Status and Attendance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Branch</span>
                <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
                  {fetchedStudent.branch || "Not specified"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Attendance</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${attendanceInfo.color}`}
                      style={{ width: `${fetchedStudent.attendance || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{fetchedStudent.attendance || 0}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge
                  variant="outline"
                  className={
                    attendanceInfo.status === "Excellent" || attendanceInfo.status === "Good"
                      ? "border-green-200 text-green-800 bg-green-50"
                      : attendanceInfo.status === "Average"
                        ? "border-orange-200 text-orange-800 bg-orange-50"
                        : "border-red-200 text-red-800 bg-red-50"
                  }
                >
                  {attendanceInfo.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Joined</span>
                <span className="text-sm">{formatDate(fetchedStudent.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editedStudent.firstName}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          firstName: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{fetchedStudent.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editedStudent.lastName}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          lastName: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{fetchedStudent.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedStudent.email}
                    onChange={(e) =>
                      setEditedStudent({
                        ...editedStudent,
                        email: e.target.value,
                      })
                    }
                    className="rounded-xl"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{fetchedStudent.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={editedStudent.address}
                    onChange={(e) =>
                      setEditedStudent({
                        ...editedStudent,
                        address: e.target.value,
                      })
                    }
                    className="rounded-xl"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{fetchedStudent.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="branch">Branch/Department</Label>
                {isEditing ? (
                  <Select
                    value={editedStudent.branch}
                    onValueChange={(value) =>
                      setEditedStudent({
                        ...editedStudent,
                        branch: value,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THANE">THANE</SelectItem>
                      <SelectItem value="NERUL">NERUL</SelectItem>
                      <SelectItem value="BORIVALI">BORIVALI</SelectItem>
                      <SelectItem value="DADAR">DADAR</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{fetchedStudent.branch || "Not specified"}</p>
                )}
              </div>

              <div>
                <Label>Enrolled Courses ({displayCourses.length})</Label>
                {isEditing ? (
                  <div className="border rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto mt-2">
                    {availableCourses.map((course) => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox
                          id={course}
                          checked={selectedCourses.includes(course)}
                          onCheckedChange={() => handleCourseToggle(course)}
                        />
                        <Label htmlFor={course} className="text-sm font-normal">
                          {course}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2">
                    {displayCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayCourses.map((course, index) => (
                          <Badge key={index} variant="secondary" className="rounded-lg">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No courses enrolled</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feesAmount">Fees Amount (Rs)</Label>
                  {isEditing ? (
                    <Input
                      id="feesAmount"
                      type="number"
                      value={editedStudent.feesAmount || ""}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          feesAmount: Number(e.target.value),
                        })
                      }
                      className="rounded-xl"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      Rs. {fetchedStudent.feesAmount?.toLocaleString() || "Not specified"}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  {isEditing ? (
                    <Checkbox
                      id="feesPaid"
                      checked={editedStudent.feesPaid || false}
                      onCheckedChange={(checked) =>
                        setEditedStudent({
                          ...editedStudent,
                          feesPaid: checked as boolean,
                        })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Fees Status:</span>
                      <Badge
                        variant="outline"
                        className={
                          fetchedStudent.feesPaid
                            ? "border-green-200 text-green-800 bg-green-50"
                            : "border-red-200 text-red-800 bg-red-50"
                        }
                      >
                        {fetchedStudent.feesPaid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  )}
                  {isEditing && (
                    <Label htmlFor="feesPaid" className="text-sm">
                      Fees Paid
                    </Label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
