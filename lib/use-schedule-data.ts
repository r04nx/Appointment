"use client"

import { useState, useEffect } from "react"
import type { ScheduleEntry } from "./types"

// Sample schedule data
const initialScheduleData: ScheduleEntry[] = [
  {
    id: "1",
    title: "Faculty Meeting",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:30",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Department Heads",
    location: "Conference Room A",
    description: "Monthly faculty meeting to discuss curriculum updates",
  },
  {
    id: "2",
    title: "Student Council",
    date: new Date().toISOString().split("T")[0],
    startTime: "11:00",
    endTime: "12:00",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Student Council Representatives",
    location: "Principal's Office",
    description: "Discussion about upcoming school events",
  },
  {
    id: "3",
    title: "Lunch Break",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:30",
    endTime: "13:30",
    type: "unavailable",
    status: "confirmed",
    color: "#ef4444",
    description: "Personal time",
  },
  {
    id: "4",
    title: "Parent-Teacher Conference",
    date: new Date().toISOString().split("T")[0],
    startTime: "14:00",
    endTime: "15:30",
    type: "appointment",
    status: "confirmed",
    color: "#10b981",
    meetingWith: "Mr. & Mrs. Johnson",
    location: "Meeting Room 2",
    description: "Discussing student progress and concerns",
  },
  {
    id: "5",
    title: "Budget Review",
    date: new Date().toISOString().split("T")[0],
    startTime: "16:00",
    endTime: "17:00",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Finance Committee",
    location: "Conference Room B",
    description: "Quarterly budget review and planning",
  },
  {
    id: "6",
    title: "School Board Meeting",
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "12:00",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "School Board Members",
    location: "Board Room",
    description: "Monthly school board meeting",
  },
  {
    id: "7",
    title: "Teacher Evaluation",
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
    startTime: "13:00",
    endTime: "14:00",
    type: "appointment",
    status: "confirmed",
    color: "#10b981",
    meetingWith: "Ms. Smith - English Department",
    location: "Classroom 101",
    description: "Annual teacher performance evaluation",
  },
  {
    id: "8",
    title: "Curriculum Development",
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
    startTime: "15:00",
    endTime: "16:30",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Curriculum Committee",
    location: "Conference Room A",
    description: "Planning for next semester's curriculum",
  },
  {
    id: "9",
    title: "Guest Speaker Coordination",
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split("T")[0],
    startTime: "09:30",
    endTime: "10:30",
    type: "appointment",
    status: "tentative",
    color: "#10b981",
    meetingWith: "Dr. Johnson - Industry Expert",
    location: "Principal's Office",
    description: "Planning for upcoming guest lecture series",
  },
  {
    id: "10",
    title: "Staff Development Workshop",
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split("T")[0],
    startTime: "13:00",
    endTime: "16:00",
    type: "event",
    status: "confirmed",
    color: "#8b5cf6",
    location: "Auditorium",
    description: "Professional development workshop for all staff",
  },
  {
    id: "11",
    title: "Community Outreach Planning",
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Outreach Committee",
    location: "Conference Room B",
    description: "Planning for community service initiatives",
  },
  {
    id: "12",
    title: "School Tour",
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split("T")[0],
    startTime: "14:00",
    endTime: "15:00",
    type: "appointment",
    status: "confirmed",
    color: "#10b981",
    meetingWith: "Prospective Students and Parents",
    location: "Main Lobby",
    description: "Tour of school facilities for prospective students",
  },
  {
    id: "13",
    title: "Math Department Meeting",
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Math Department Faculty",
    location: "Room 203",
    description: "Discussion of curriculum changes and teaching strategies",
  },
  {
    id: "14",
    title: "Graduation Planning",
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split("T")[0],
    startTime: "13:00",
    endTime: "14:30",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "Graduation Committee",
    location: "Conference Room A",
    description: "Planning for upcoming graduation ceremony",
  },
  {
    id: "15",
    title: "School Play Rehearsal",
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split("T")[0],
    startTime: "16:00",
    endTime: "18:00",
    type: "event",
    status: "confirmed",
    color: "#8b5cf6",
    location: "Auditorium",
    description: "Observing final rehearsal for school play",
  },
]

export function useScheduleData() {
  // Use localStorage to persist schedule data
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>(initialScheduleData)

  useEffect(() => {
    // Load data from localStorage if available
    const savedData = localStorage.getItem("principalSchedule")
    if (savedData) {
      setScheduleData(JSON.parse(savedData))
    }
  }, [])

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem("principalSchedule", JSON.stringify(scheduleData))
  }, [scheduleData])

  return { scheduleData, setScheduleData }
}

