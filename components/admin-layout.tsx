"use client"

import type { ReactNode } from "react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Camera,
  FileText,
  SettingsIcon,
  GraduationCap,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppContext } from "@/lib/context"

interface AdminLayoutProps {
  children: ReactNode
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "face-attendance", label: "Face Attendance", icon: Camera },
  { id: "reports", label: "Reports", icon: FileText },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const { activeModule, setActiveModule } = useAppContext()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white rounded-r-3xl shadow-sm z-10 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">RKDemy.</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveModule(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                      activeModule === item.id ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Links */}
        <div className="p-4 border-t border-gray-100">
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50">
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">Help</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 w-full min-h-screen">
        {/* Header */}
        <header className="bg-white p-4 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search here..." className="pl-10 rounded-xl border-gray-200" />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
