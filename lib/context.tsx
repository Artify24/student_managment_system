"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

// Types based on API response
interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  address?: string
  imageUrl?: string
  branch: string
  attendance: number
  absent: number
  feesPaid: boolean
  feesAmount?: number
  createdAt: string
}

interface Session {
  id: number
  courseName: string
  date: string
  time: string
  present: Student[]
  absent: Student[]
}

interface AppContextType {
  sessions: Session[]
  setSessions: (sessions: Session[]) => void
  activeSession: Session | null
  setActiveSession: (session: Session | null) => void
  activeModule: string
  setActiveModule: (module: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [activeModule, setActiveModule] = useState("dashboard")

  // Fetch sessions from API on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/session/today")
        if (!response.ok) throw new Error("Failed to fetch sessions")
        const data: Session[] = await response.json()
      console.log("Fetched sessions:", data)
        setSessions(data)
      } catch (error) {
        console.error("Error fetching sessions:", error)
      }
    }

    fetchSessions()
  }, [])

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
