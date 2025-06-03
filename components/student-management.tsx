"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Eye, Edit, Upload, Filter, CheckCircle, Trash2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { X, User } from "lucide-react"
import { StudentDetails } from "./student-details"
import axios from "axios"

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

export function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [feesPaid, setFeesPaid] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [firstname, setfirstname] = useState("")
  const [lastname, setlastname] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [branch, setBranch] = useState("")
  const [feesAmount, setFeesAmount] = useState<number | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [open, setopen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [attendanceUpdating, setAttendanceUpdating] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  // useEffect to get students from the server
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/api/students")
        const studentsData = Array.isArray(response.data) ? response.data : []
        setStudents(studentsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching students:", error)
        setStudents([]) 
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  
  const filteredStudents = Array.isArray(students)
    ? students.filter((student) => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) || student.id?.toString().includes(searchTerm.toLowerCase())

        const matchesClass = selectedClass === "all" || student.class === selectedClass

        const matchesTab = activeTab === "all" || student.status === activeTab

        return matchesSearch && matchesClass && matchesTab
      })
    : []

  const handleCourseToggle = (course: string) => {
    setSelectedCourses((prev) => (prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]))
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // handle form submission
  const handleSubmit = async () => {
    let imageUrl = null
    setopen(false)

    if (selectedImage) {
      imageUrl = URL.createObjectURL(selectedImage)
      setUploadedImageUrl(imageUrl)
      console.log("Image URL created:", imageUrl)
    }

    const formData = {
      firstName: firstname,
      lastName: lastname,
      email,
      address,
      branch,
      courses:selectedCourses,
      feesAmount,
      feesPaid,
      imageUrl,
    }

    try {
      // api to send data
      const response = await axios.post("/api/students", formData)
      console.log("Response from server:", response.data)

      // Add the new student to local state
      setStudents([...students, response.data])

      // Reset form
      setfirstname("")
      setlastname("")
      setEmail("")
      setAddress("")
      setBranch("")
      setSelectedCourses([])
      setFeesAmount(null)
      setFeesPaid(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error adding student:", error)
      alert("Failed to add student. Please try again.")
    }
  }

  // Handle attendance update
  const handleAttendanceUpdate = async (studentId: number, present: boolean) => {
    setAttendanceUpdating(studentId)

    try {
      const student = students.find((s) => s.id === studentId)
      if (!student) return

      const currentAttendance = student.attendance || 0
      const newAttendance = present ? Math.min(100, currentAttendance + 2) : Math.max(0, currentAttendance - 5)

      // API call to update attendance
      const response = await axios.patch(`/api/students/${studentId}/attendance`, {
        present,
        newAttendance,
        lastAttendance: new Date().toISOString().split("T")[0],
      })

      // Update local state with response
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          return response.data
        }
        return s
      })

      setStudents(updatedStudents)
      console.log(`Attendance updated for student ${studentId}: ${newAttendance}%`)
    } catch (error) {
      console.error("Error updating attendance:", error)
      alert("Failed to update attendance. Please try again.")
    } finally {
      setAttendanceUpdating(null)
    }
  }

  // Handle view student details
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentDetails(true)
  }

  // Handle update student from details component
  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      console.log("Updating student:", updatedStudent)
     
      // API call to update student
      const response = await axios.put(`/api/students/${updatedStudent.id}`, updatedStudent)
      console.log("Student updated on server:", response.data)

      // Update local state
      const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? response.data : s))
      setStudents(updatedStudents)
      setShowStudentDetails(false)
      setSelectedStudent(null)
    } catch (error) {
      console.error("Error updating student:", error)
      alert("Failed to update student. Please try again.")
    }
  }

  if (showStudentDetails && selectedStudent) {
    return (
      <StudentDetails
        student={selectedStudent}
        onBack={() => {
          setShowStudentDetails(false)
          setSelectedStudent(null)
        }}
        onUpdate={handleUpdateStudent}
      />
    )
  }

  const deleteStudent = async (studentId: number) => {
    console.log("Deleting student with ID:", studentId);
    try {
      // API call to delete student
      await axios.delete(`/api/students/${studentId}`);
      console.log(`Student with ID ${studentId} deleted successfully`);

      // Update local state
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student. Please try again.");
    }

  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Students</h1>
          <p className="text-gray-600">Manage student database and attendance records</p>
        </div>
        <Dialog open={open} onOpenChange={setopen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="rounded-xl"
                    onChange={(e) => setfirstname(e.target.value)}
                    value={firstname}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="rounded-xl"
                    onChange={(e) => setlastname(e.target.value)}
                    value={lastname}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  className="rounded-xl"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  className="rounded-xl"
                  rows={3}
                  onChange={(e) => setAddress(e.target.value)}
                  value={address}
                />
              </div>

              {/* Profile Photo */}
              <div>
                <Label>Profile Photo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="border-2 border-gray-300 rounded-xl p-4">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedImage?.name} ({(selectedImage?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={triggerFileInput}
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={triggerFileInput}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload photo for face recognition</p>
                      <p className="text-xs text-gray-400 mb-3">PNG, JPG up to 5MB</p>
                      <Button type="button" variant="outline" size="sm" className="rounded-xl">
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Information */}
              <div>
                <Label htmlFor="branch">Branch/Department</Label>
                <Select onValueChange={setBranch} value={branch}>
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
              </div>

              {/* Courses */}
              <div>
                <Label>Courses</Label>
                <div className="border rounded-xl p-4 space-y-2 max-h-32 overflow-y-auto">
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
                        checked={selectedCourses.includes(course)}
                        onCheckedChange={() => handleCourseToggle(course)}
                      />
                      <Label htmlFor={course} className="text-sm font-normal">
                        {course}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fees Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feesAmount">Fees Amount ($)</Label>
                  <Input
                    id="feesAmount"
                    type="number"
                    placeholder="5000"
                    className="rounded-xl"
                    min="0"
                    step="0.01"
                    onChange={(e) => setFeesAmount(Number(e.target.value))}
                    value={feesAmount !== null ? feesAmount.toString() : ""}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="feesPaid"
                    checked={feesPaid}
                    onCheckedChange={(checked) => setFeesPaid(checked as boolean)}
                  />
                  <Label htmlFor="feesPaid">Fees Paid</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl"
                  onClick={handleSubmit}
                >
                  Add Student
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Student list table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="THANE">THANE</SelectItem>
                  <SelectItem value="NERUL">NERUL</SelectItem>
                  <SelectItem value="BORIVALI">BORIVALI</SelectItem>
                  <SelectItem value="DADAR">DADAR</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 mb-6">
              <TabsTrigger value="all">All Students</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No students found matching your filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Fees Paid</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.branch}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell ><Badge
                                              variant="outline"
                                              className={
                                                student.feesPaid
                                                  ? "border-green-200 text-green-800 bg-green-50"
                                                  : "border-red-200 text-red-800 bg-red-50"
                                              }
                                            >
                                              {student.feesPaid ? "Yes" : "No"}
                                            </Badge></TableCell>
                    
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-8 w-8 p-0"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-8 w-8 p-0"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-8 w-8 p-0"
                            onClick={()=> deleteStudent(student.id)}
                          >
                            <Trash2 className="w-4 h-4" 
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
