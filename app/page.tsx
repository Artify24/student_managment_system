"use client"
import { AdminLayout } from "@/components/admin-layout"
import { Dashboard } from "@/components/dashboard"
import { StudentManagement } from "@/components/student-management"
import { SessionManagement } from "@/components/session-management"
import { FaceAttendance } from "@/components/face-attendance"
import { AttendanceReports } from "@/components/attendance-reports"
import { AppProvider, useAppContext } from "@/lib/context"

function AdminPanel() {
  const { activeModule } = useAppContext()

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "students":
        return <StudentManagement />
      case "sessions":
        return <SessionManagement />
      case "face-attendance":
        return <FaceAttendance />
      case "reports":
        return <AttendanceReports />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <AdminLayout>{renderActiveModule()}</AdminLayout>
    </div>
  )
}

export default function AppWithProvider() {
  return (
    <AppProvider>
      <AdminPanel />
    </AppProvider>
  )
}
