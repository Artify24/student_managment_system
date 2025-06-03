"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Session {
  id: string
  title: string
  class: string
  date: string
  time: string
  status: string
  duration?: string
  enrolled?: number
  attended?: number
}

interface AppContextType {
  sessions: Session[]
  setSessions: (sessions: Session[]) => void
  activeSession: Session | null
  setActiveSession: (session: Session | null) => void
  activeModule: string
  setActiveModule: (module: string) => void
}

const initialSessions: Session[] = [
  {
    id: "SES001",
    title: "Advanced Algorithms",
    class: "CS-101",
    date: "2024-01-15",
    time: "09:00 AM",
    status: "completed",
    enrolled: 25,
    attended: 23,
  },
  {
    id: "SES002",
    title: "Database Design",
    class: "CS-201",
    date: "2024-01-15",
    time: "02:00 PM",
    status: "completed",
    enrolled: 18,
    attended: 16,
  },
  {
    id: "SES003",
    title: "Linear Algebra",
    class: "MATH-201",
    date: "2024-01-16",
    time: "10:00 AM",
    status: "scheduled",
    enrolled: 32,
    attended: 0,
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [activeSession, setActiveSession] = useState<Session | null>(null)

  return (
    <AppContext.Provider
      value={{
        sessions,
        setSessions,
        activeSession,
        setActiveSession,
        activeModule,
        setActiveModule,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider")
  }
  return context
}
