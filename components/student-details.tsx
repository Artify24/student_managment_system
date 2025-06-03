"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Save, X, User, Mail, MapPin, GraduationCap, DollarSign } from "lucide-react"
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
  selectedCourses?: string[]
  feesAmount?: number
  feesPaid?: boolean
  imageUrl?: string
  attendance?: number
  lastAttendance?: string
  status?: string
  class?: string
}

interface StudentDetailsProps {
  student: Student
  onBack: () => void
  onUpdate: (student: Student) => void
}

export function StudentDetails({ student, onBack, onUpdate }: StudentDetailsProps) {
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${student.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch student data")
        }
        const data = await response.json()
        setEditedStudent(data)
        setImagePreview(data.imageUrl || null)
        console.log("Fetched student data:", data)
      } catch (error) {
        console.error("Error fetching student data:", error)
      }
    }

    // fetchStudent();
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedStudent, setEditedStudent] = useState<Student>(student)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(student.imageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  console.log("Initial student data:", student)

  const handleCourseToggle = (course: string) => {
    const currentCourses = editedStudent.selectedCourses || []
    const updatedCourses = currentCourses.includes(course)
      ? currentCourses.filter((c) => c !== course)
      : [...currentCourses, course]

    setEditedStudent({
      ...editedStudent,
      selectedCourses: updatedCourses,
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
    }

    // This will trigger the API call in the parent component
    onUpdate(updatedStudent)
    setIsEditing(false)
    console.log("Student updated:", updatedStudent)
  }

  const handleCancel = () => {
    setEditedStudent(student)
    setSelectedImage(null)
    setImagePreview(student.imageUrl || null)
    setIsEditing(false)
  }

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
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600">Student ID: {student.id}</p>
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
                src={student.imageUrl || ""}
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
                <Badge
                  variant="outline"
                  className={
                    student.branch === "active"
                      ? "border-green-200 text-green-800 bg-green-50"
                      : "border-gray-200 text-gray-800 bg-gray-50"
                  }
                >
                  {student.branch || "unknown"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Attendance</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (student.attendance || 0) >= 90
                          ? "bg-green-500"
                          : (student.attendance || 0) >= 75
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${student.attendance || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{student.attendance || 0}%</span>
                </div>
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
                    <p className="text-sm text-gray-900 mt-1">{student.firstName}</p>
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
                    <p className="text-sm text-gray-900 mt-1">{student.lastName}</p>
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
                  <p className="text-sm text-gray-900 mt-1">{student.email}</p>
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
                  <p className="text-sm text-gray-900 mt-1">{student.address}</p>
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
                  <p className="text-sm text-gray-900 mt-1">{student.branch || "Not specified"}</p>
                )}
              </div>

              <div>
                <Label htmlFor="class">Branch</Label>
                <p className="text-sm text-gray-900 mt-1">{student.branch || "Not specified"}</p>
              </div>

              <div>
                <Label>Enrolled Courses</Label>
                {isEditing ? (
                  <div className="border rounded-xl p-4 space-y-2 max-h-32 overflow-y-auto mt-2">
                    {[
                      "Mathematics",
                      "Physics",
                      "Chemistry",
                      "Data Structures and Algorithms",
                      "Operating Systems",
                      "Database Management Systems",
                      "Computer Networks",
                      "Graphics",
                    ].map((course) => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox
                          id={course}
                          checked={(editedStudent.selectedCourses || []).includes(course)}
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
                    {student.selectedCourses && student.selectedCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {student.selectedCourses.map((course) => (
                          <Badge key={course} variant="secondary" className="rounded-lg">
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
                      Rs.
                      {student.feesAmount?.toLocaleString() || "Not specified"}
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
                          student.feesPaid
                            ? "border-green-200 text-green-800 bg-green-50"
                            : "border-red-200 text-red-800 bg-red-50"
                        }
                      >
                        {student.feesPaid ? "Paid" : "Pending"}
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
