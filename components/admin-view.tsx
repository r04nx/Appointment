"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Filter, Check, X, CalendarIcon, Clock, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import type { ScheduleEntry } from "@/lib/types" // Assumed to have room and approved
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react" // Added for role-based UI

// Interface for validation
interface ValidatableScheduleEntry {
  id?: string
  title?: string
  date?: string | Date
  startTime?: string
  endTime?: string
  type?: string
  status?: string
  color?: string
  meetingWith?: string
  location?: string
  description?: string
  room?: string // Added room
  approved?: boolean // Added approved
}

// Room options
const availableRooms = ["Principal's Office", "Conference Hall", "Auditorium"] as const;
type RoomType = typeof availableRooms[number];

// Predefined colors for schedule entries
const predefinedColors = [
  { name: "Blue", value: "#4f46e5" },
  { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Yellow", value: "#eab308" },
  { name: "Gray", value: "#6b7280" },
  { name: "Indigo", value: "#6366f1" },
]

// Map meeting types to default colors
const meetingTypeColors = {
  "meeting": "#4f46e5", // Blue
  "appointment": "#8b5cf6", // Purple
  "event": "#f97316", // Orange
  "class": "#10b981", // Green
  "office-hours": "#14b8a6", // Teal
  "unavailable": "#6b7280", // Gray
}

export default function AdminView() {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [meetingType, setMeetingType] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("all")
  const { data: session } = useSession(); // Get session data for role-based UI
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentRoomFilter, setCurrentRoomFilter] = useState<RoomType | "all">("Principal's Office"); // Default room

  // New entry form state
  const [newEntry, setNewEntry] = useState<Partial<ScheduleEntry>>({
    title: "",
    date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:00",
    type: "meeting",
    status: "confirmed",
    color: "#4f46e5",
    meetingWith: "",
    location: "", // Specific location (optional)
    description: "",
    room: "Principal's Office", // Default room
    approved: true, // Default approved status
  })
  
  // Update newEntry date when calendar date changes
  useEffect(() => {
    if (date) {
      // Format date without timezone conversion to prevent date shift
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setNewEntry(prev => ({ ...prev, date: formattedDate }))
    }
  }, [date])

  // Fetch schedule data
  useEffect(() => {
    // Renaming to avoid conflict with global fetch
    const fetchScheduleDataForComponent = async () => {
      setIsLoading(true)
      try {
        let url = "/api/schedule"
        const params = new URLSearchParams()

        if (date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          params.append("date", formattedDate)
        }

        if (currentRoomFilter && currentRoomFilter !== "all") {
          params.append("room", currentRoomFilter)
        }

        if (params.toString()) {
          url += `?${params.toString()}`
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error("Failed to fetch schedule data")
        }

        const data = await response.json()
        setScheduleData(data)
      } catch (error) {
        console.error("Error fetching schedule data:", error)
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
          variant: "destructive",
        })
        // Fallback to empty array if API fails
        setScheduleData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchScheduleDataForComponent()
  }, [date, currentRoomFilter])

  // Filter schedule data based on selected filters (client-side, after API fetch)
  const filteredSchedule = scheduleData.filter((entry) => {
    // API handles date and room filtering. Client-side filters are for type and time range.
    const meetingTypeMatch = meetingType === "all" || entry.type === meetingType

    let timeRangeMatch = true
    if (timeRange === "morning") {
      timeRangeMatch = Number.parseInt(entry.startTime.split(":")[0]) < 12
    } else if (timeRange === "afternoon") {
      const hour = Number.parseInt(entry.startTime.split(":")[0])
      timeRangeMatch = hour >= 12 && hour < 17
    } else if (timeRange === "evening") {
      timeRangeMatch = Number.parseInt(entry.startTime.split(":")[0]) >= 17
    }

    return meetingTypeMatch && timeRangeMatch
  })

  // Get unique meeting types for filter
  const meetingTypes = ["all", ...new Set(scheduleData.map((entry) => entry.type))]

  // Generate time slots from 8 AM to 10 PM in 30-minute increments
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        slots.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleTimeSlotClick = (timeSlot: string) => {
    if (!isSelecting) return

    setSelectedTimeSlots((prev) => {
      if (prev.includes(timeSlot)) {
        return prev.filter((slot) => slot !== timeSlot)
      } else {
        return [...prev, timeSlot]
      }
    })
  }

  // Validation function for schedule entries
  const validateScheduleEntry = (entry: ValidatableScheduleEntry) => {
    const errors = []
    
    // Check required fields
    if (!entry.title) errors.push("Title is required")
    if (!entry.date) errors.push("Date is required")
    if (!entry.startTime) errors.push("Start time is required")
    if (!entry.endTime) errors.push("End time is required")
    if (!entry.type) errors.push("Meeting type is required")
    if (!entry.status) errors.push("Status is required")
    if (!entry.room) errors.push("Room is required") 
    
    // Check time logic
    if (entry.startTime && entry.endTime) {
      const startMinutes = convertTimeToMinutes(entry.startTime)
      const endMinutes = convertTimeToMinutes(entry.endTime)
      
      if (startMinutes >= endMinutes) {
        errors.push("End time must be after start time")
      }
      
      // Check if duration is reasonable (e.g., not more than 8 hours)
      const durationHours = (endMinutes - startMinutes) / 60
      if (durationHours > 8) {
        errors.push(`Meeting duration is ${durationHours.toFixed(1)} hours. Consider breaking into multiple entries.`)
      }
    }
    
    return errors
  }
  
  // Helper function to convert time string to minutes
  const convertTimeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  // State for validation warnings
  const [validationWarningOpen, setValidationWarningOpen] = useState(false)
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [pendingSubmission, setPendingSubmission] = useState<string>("") // "add" or "update"
  
  // Ensure the validation dialog is properly initialized
  useEffect(() => {
    // This ensures the validation dialog state is properly initialized
    if (validationWarnings.length > 0 && pendingSubmission && !validationWarningOpen) {
      setValidationWarningOpen(true)
    }
  }, [validationWarnings, pendingSubmission, validationWarningOpen])

  const handleAddEntry = async () => {
    // Validate the entry
    const validationErrors = validateScheduleEntry(newEntry)
    
    // If there are validation errors that are critical, show toast and return
    const criticalErrors = validationErrors.filter(error => 
      error.includes("required") || error.includes("must be after")
    )
    
    if (criticalErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: criticalErrors.join(", "),
        variant: "destructive",
      })
      return
    }
    
    // If there are non-critical warnings, show warning dialog
    const warnings = validationErrors.filter(error => 
      !error.includes("required") && !error.includes("must be after")
    )
    
    if (warnings.length > 0) {
      setValidationWarnings(warnings)
      setPendingSubmission("add")
      setValidationWarningOpen(true)
      return
    }

    await proceedWithAddEntry()
  }
  
  // Function to proceed with adding an entry after all validations
  const proceedWithAddEntry = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      })

      if (!response.ok) {
        throw new Error("Failed to create schedule entry")
      }

      const responseData = await response.json() // API returns { message: string, entry: ScheduleEntry }
      const createdEntry = responseData.entry;

      // Reset form
      const currentDate = date || new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      setNewEntry({
        title: "",
        date: formattedDate,
        startTime: "08:00",
        endTime: "09:00",
        type: "meeting",
        status: "confirmed",
        color: "#4f46e5",
        meetingWith: "",
        location: "", // Specific location
        description: "",
        room: "Principal's Office", // Reset room to default
        approved: true, // Reset approved status
      })

      setIsDialogOpen(false)

      // Refresh data for the current view to get the latest state from the server
      await fetchScheduleDataForComponent(); 

      toast({
        title: responseData.message ? "Server Notification" : "Success",
        description: responseData.message || (createdEntry.approved === false ? "Entry created, pending approval due to conflict." : "Schedule entry created successfully."),
      });
    } catch (error) {
      console.error("Error creating schedule entry:", error)
      // Ensure createdEntry is defined before trying to access its properties
      const entryDetails = newEntry ? `${newEntry.title} on ${newEntry.date}` : "entry";
      toast({
        title: "Error",
        description: "Failed to create schedule entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry) return
    
    // Validate the entry
    const validationErrors = validateScheduleEntry(editingEntry)
    
    // If there are validation errors that are critical, show toast and return
    const criticalErrors = validationErrors.filter(error => 
      error.includes("required") || error.includes("must be after")
    )
    
    if (criticalErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: criticalErrors.join(", "),
        variant: "destructive",
      })
      return
    }
    
    // If there are non-critical warnings, show warning dialog
    const warnings = validationErrors.filter(error => 
      !error.includes("required") && !error.includes("must be after")
    )
    
    if (warnings.length > 0) {
      setValidationWarnings(warnings)
      setPendingSubmission("update")
      setValidationWarningOpen(true)
      return
    }

    await proceedWithUpdateEntry()
  }
  
  // Function to proceed with updating an entry after all validations
  const proceedWithUpdateEntry = async () => {
    if (!editingEntry) return
    
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/schedule/${editingEntry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingEntry),
      })

      if (!response.ok) {
        throw new Error("Failed to update schedule entry")
      }

      const responseData = await response.json(); // API returns { message: string, entry: ScheduleEntry }
      const updatedEntry = responseData.entry;
      
      // Refresh data for the current view to get the latest state from the server
      await fetchScheduleDataForComponent();

      setEditingEntry(null)

      toast({
        title: responseData.message ? "Server Notification" : "Success",
        description: responseData.message || (updatedEntry.approved === false ? "Entry updated, pending approval due to conflict." : "Schedule entry updated successfully."),
      });
    } catch (error) {
      console.error("Error updating schedule entry:", error)
      // Ensure updatedEntry is defined before trying to access its properties
      const entryDetails = editingEntry ? `${editingEntry.title} on ${editingEntry.date}` : "entry";
      toast({
        title: "Error",
        description: "Failed to update schedule entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)

  const confirmDelete = (id: string) => {
    setEntryToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      // Find the entry to get its date before deleting
      const entryToDelete = scheduleData.find(entry => entry.id === id)
      const entryDate = entryToDelete?.date
      
      const response = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule entry")
      }

      // If we have the date, fetch updated data for that date
      if (entryDate) {
        const fetchUrl = `/api/schedule?date=${entryDate}`
        const refreshResponse = await fetch(fetchUrl)
        
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json()
          setScheduleData(refreshedData)
        } else {
          // If refresh fails, at least update local state by removing the deleted entry
          setScheduleData((prev) => prev.filter((entry) => entry.id !== id))
        }
      } else {
        // If we don't have the date, just update local state
        setScheduleData((prev) => prev.filter((entry) => entry.id !== id))
      }

      toast({
        title: "Success",
        description: "Schedule entry deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting schedule entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setEntryToDelete(null)
    }
  }

  // Check if a time slot overlaps with existing entries for a specific room and date
  const checkOverlap = (startTime: string, endTime: string, date: string, room: string, entryIdToExclude?: string) => {
    // Filter schedule entries for the current date and room, excluding a specific entry if ID provided
    const entriesForDateAndRoom = scheduleData.filter(entry => 
      entry.date === date && 
      entry.room === room &&
      entry.approved === true && // Only consider approved entries for overlap
      (!entryIdToExclude || entry.id !== entryIdToExclude)
    )
    
    if (entriesForDateAndRoom.length === 0) return { overlaps: false }
    
    // Convert times to minutes for easier comparison
    const convertToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const newStartMinutes = convertToMinutes(startTime)
    const newEndMinutes = convertToMinutes(endTime)
    
    // Check for overlaps
    const overlappingEntries = entriesForDate.filter(entry => {
      const entryStartMinutes = convertToMinutes(entry.startTime)
      const entryEndMinutes = convertToMinutes(entry.endTime)
      
      // Check if the new entry overlaps with this existing entry
      return (
        (newStartMinutes < entryEndMinutes && newEndMinutes > entryStartMinutes) ||
        (entryStartMinutes < newEndMinutes && entryEndMinutes > newStartMinutes)
      )
    })
    
    return {
      overlaps: overlappingEntries.length > 0,
      entries: overlappingEntries
    }
  }

  const [overlapWarningOpen, setOverlapWarningOpen] = useState(false)
  const [overlappingEntries, setOverlappingEntries] = useState<any[]>([])
  const [pendingEntry, setPendingEntry] = useState<any>(null)

  const handleCreateFromSelection = () => {
    if (selectedTimeSlots.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one time slot",
        variant: "destructive",
      })
      return
    }

    // Sort selected time slots
    const sortedSlots = [...selectedTimeSlots].sort()
    
    // Get the start time from the first selected slot
    const startTime = sortedSlots[0]
    
    // Calculate the end time correctly
    // For the last selected slot, we need to add 30 minutes to get the proper end time
    const lastSlot = sortedSlots[sortedSlots.length - 1]
    let endHour = parseInt(lastSlot.split(':')[0])
    let endMinute = parseInt(lastSlot.split(':')[1])
    
    // Add 30 minutes to the last slot to get the correct end time
    if (endMinute === 30) {
      endHour += 1
      endMinute = 0
    } else {
      endMinute = 30
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
    
    // Format date without timezone conversion
    const currentDate = date || new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    // Determine the room for overlap check.
    const roomForOverlapCheck = (currentRoomFilter && currentRoomFilter !== "all") ? currentRoomFilter : newEntry.room || "Principal's Office";
    
    // Check for overlaps with existing entries
    const { overlaps, entries } = checkOverlap(startTime, endTime, formattedDate, roomForOverlapCheck)
    
    if (overlaps) {
      // Store the overlapping entries and the pending entry
      setOverlappingEntries(entries || [])
      setPendingEntry({
        date: formattedDate,
        startTime: startTime,
        endTime: endTime,
        room: roomForOverlapCheck, // Include room in pending entry
      })
      
      // Show the overlap warning dialog
      setOverlapWarningOpen(true)
      return
    }
    
    // No overlaps, proceed with creating the entry
    setNewEntry((prev) => ({
      ...prev,
      date: formattedDate,
      startTime: startTime,
      endTime: endTime,
      room: roomForOverlapCheck, 
      approved: true, 
    }))
      
    setIsDialogOpen(true)
    setIsSelecting(false)
    setSelectedTimeSlots([])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          Principal's Schedule Management
        </h2>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Ensure the date in the form matches the currently selected date
                  if (date) {
                    // Format date without timezone conversion to prevent date shift
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    setNewEntry(prev => ({ ...prev, date: formattedDate }))
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Schedule Entry</DialogTitle>
                <DialogDescription>Create a new entry in the principal's schedule</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      placeholder="Meeting title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room">Room *</Label>
                    <Select
                      value={newEntry.room}
                      onValueChange={(value: RoomType) => setNewEntry({ ...newEntry, room: value })}
                    >
                      <SelectTrigger id="room">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map(roomName => (
                          <SelectItem key={roomName} value={roomName}>{roomName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="location">Specific Location (Optional)</Label>
                    <Input
                      id="location"
                      value={newEntry.location}
                      onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                      placeholder="e.g., Office, Lab A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time *</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time *</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Meeting Type *</Label>
                    <Select 
                      value={newEntry.type} 
                      onValueChange={(value) => {
                        // Set default color based on meeting type
                        const defaultColor = meetingTypeColors[value as keyof typeof meetingTypeColors] || "#4f46e5";
                        setNewEntry({ ...newEntry, type: value, color: defaultColor });
                      }}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="office-hours">Office Hours</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={newEntry.status}
                      onValueChange={(value) => setNewEntry({ ...newEntry, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="tentative">Tentative</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={newEntry.color}
                        onChange={(e) => setNewEntry({ ...newEntry, color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={newEntry.color}
                        onChange={(e) => setNewEntry({ ...newEntry, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border ${newEntry.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                          onClick={() => setNewEntry({ ...newEntry, color: color.value })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-with">Meeting With</Label>
                  <Input
                    id="meeting-with"
                    value={newEntry.meetingWith}
                    onChange={(e) => setNewEntry({ ...newEntry, meetingWith: e.target.value })}
                    placeholder="Person or group name"
                  />
                </div>
                {/* Location field is now part of a grid with Room */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Additional details"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Validation Warning Dialog */}
          <AlertDialog open={validationWarningOpen} onOpenChange={setValidationWarningOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Schedule Entry Warning</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4">
                    <p>The following issues were detected with your schedule entry:</p>
                    
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-yellow-50">
                      <ul className="list-disc pl-5 space-y-1">
                        {validationWarnings.map((warning, index) => (
                          <li key={index} className="text-amber-700">{warning}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <p>Do you want to proceed anyway?</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={() => {
                    setValidationWarningOpen(false)
                    setPendingSubmission("")
                    setValidationWarnings([])
                  }}>
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={async () => {
                    setValidationWarningOpen(false)
                    
                    // Proceed with the appropriate action
                    if (pendingSubmission === "add") {
                      await proceedWithAddEntry()
                    } else if (pendingSubmission === "update") {
                      await proceedWithUpdateEntry()
                    }
                    
                    setPendingSubmission("")
                    setValidationWarnings([])
                  }}>
                    Proceed Anyway
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Overlap Warning Dialog */}
          <AlertDialog open={overlapWarningOpen} onOpenChange={setOverlapWarningOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Schedule Conflict Detected</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4">
                    <p>The time slot you selected overlaps with {overlappingEntries.length} existing {overlappingEntries.length === 1 ? 'entry' : 'entries'}:</p>
                    
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      {overlappingEntries.map((entry, index) => (
                        <div key={index} className="p-2 mb-2 bg-gray-50 rounded border-l-4" style={{ borderLeftColor: entry.color || '#4f46e5' }}>
                          <p className="font-medium">{entry.title} ({entry.room})</p>
                          <p className="text-sm text-gray-500">{entry.startTime} - {entry.endTime}</p>
                          <p className="text-xs text-gray-400">{entry.type} {entry.approved === false && <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300">Pending Approval</Badge>}</p>
                        </div>
                      ))}
                    </div>
                    
                    <p>Do you still want to create a schedule entry during this time? {session?.user?.role !== 'superadmin' && "(It may require approval if it conflicts)"}</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={() => {
                    setOverlapWarningOpen(false)
                    setPendingEntry(null)
                    setOverlappingEntries([])
                  }}>
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={() => {
                    // Proceed with creating the entry despite the overlap
                    setOverlapWarningOpen(false)
                    
                    if (pendingEntry) {
                      setNewEntry((prev) => ({
                        ...prev,
                        date: pendingEntry.date,
                        startTime: pendingEntry.startTime,
                        endTime: pendingEntry.endTime,
                        room: pendingEntry.room || "Principal's Office", // Use room from pendingEntry
                        approved: true, // Default to true, API will handle if it needs to be false
                      }))
                      
                      setIsDialogOpen(true)
                      setIsSelecting(false)
                      setSelectedTimeSlots([])
                      setPendingEntry(null)
                      setOverlappingEntries([])
                    }
                  }}>
                    {session?.user?.role === 'superadmin' ? "Create Anyway (Superadmin Override)" : "Create Anyway"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {isSelecting ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCreateFromSelection} className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Create from Selection
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsSelecting(false)
                  setSelectedTimeSlots([])
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel Selection
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsSelecting(true)} className="flex items-center gap-2">
              <Clock className="h-4 w-4 mr-1" />
              Select Time Slots
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

            <div className="mt-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Legend
              </h3>
              <div className="space-y-2">
                {Object.entries(meetingTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-sm">
                      {type === "meeting" ? "Meeting" :
                               type === "appointment" ? "Appointment" :
                               type === "event" ? "Event" :
                               type === "class" ? "Class" :
                               type === "office-hours" ? "Office Hours" :
                               type === "unavailable" ? "Unavailable" : type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
                      Schedule for {currentRoomFilter === "all" ? "All Rooms" : currentRoomFilter} on {date ? formatDate(date) : "Today"}
            </h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Schedule</SheetTitle>
                  <SheetDescription>Customize which schedule entries are displayed</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                           <div className="space-y-2">
                            <Label htmlFor="room-filter">Room</Label>
                            <Select value={currentRoomFilter} onValueChange={(value: RoomType | "all") => setCurrentRoomFilter(value)}>
                              <SelectTrigger id="room-filter">
                                <SelectValue placeholder="Select room" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Rooms</SelectItem>
                                {availableRooms.map(roomName => (
                                  <SelectItem key={roomName} value={roomName}>{roomName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                  <div className="space-y-2">
                    <Label htmlFor="meeting-type">Meeting Type</Label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger id="meeting-type">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-range">Time Range</Label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger id="time-range">
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Day</SelectItem>
                        <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM - 10PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[600px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Time indicators */}
                      <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-gray-200">
                        {Array.from({ length: 15 }).map((_, i) => {
                          const hour = i + 8 // Start from 8 AM
                          const displayHour = hour > 12 ? hour - 12 : hour
                          const amPm = hour >= 12 ? "PM" : "AM"
                          return (
                            <div key={i} className="h-20 text-xs text-gray-500 text-right pr-2 pt-0">
                              {displayHour} {amPm}
                            </div>
                          )
                        })}
                      </div>

                      {/* Timeline content */}
                      <div className="ml-16 relative">
                        {Array.from({ length: 15 }).map((_, i) => {
                          const hour = i + 8
                          return (
                            <div key={i} className="h-20 border-b border-gray-100 relative">
                              <div className="absolute left-0 right-0 h-px bg-gray-200 top-0"></div>

                              {/* Half-hour marker */}
                              <div className="absolute left-0 right-0 h-px bg-gray-100 top-[50%]"></div>

                              {/* Time slot selection */}
                              {isSelecting && (
                                <>
                                  <div
                                    className={`absolute left-0 right-0 top-0 h-[50%] cursor-pointer hover:bg-blue-100/50 ${
                                      selectedTimeSlots.includes(`${hour.toString().padStart(2, "0")}:00`)
                                        ? "bg-blue-300/40 border border-blue-400/50 backdrop-blur-[1px]"
                                        : ""
                                    }`}
                                    onClick={() => handleTimeSlotClick(`${hour.toString().padStart(2, "0")}:00`)}
                                    style={{ zIndex: 3 }} // Higher z-index to ensure it's clickable
                                  ></div>
                                  <div
                                    className={`absolute left-0 right-0 top-[50%] h-[50%] cursor-pointer hover:bg-blue-100/50 ${
                                      selectedTimeSlots.includes(`${hour.toString().padStart(2, "0")}:30`)
                                        ? "bg-blue-300/40 border border-blue-400/50 backdrop-blur-[1px]"
                                        : ""
                                    }`}
                                    onClick={() => handleTimeSlotClick(`${hour.toString().padStart(2, "0")}:30`)}
                                    style={{ zIndex: 3 }} // Higher z-index to ensure it's clickable
                                  ></div>
                                </>
                              )}
                            </div>
                          )
                        })}

                        {/* Schedule entries - show during both normal view and selection mode */}
                        {filteredSchedule.map((entry, index) => {
                            const startHour = Number.parseInt(entry.startTime.split(":")[0])
                            const startMinute = Number.parseInt(entry.startTime.split(":")[1])
                            const endHour = Number.parseInt(entry.endTime.split(":")[0])
                            const endMinute = Number.parseInt(entry.endTime.split(":")[1])

                            const startPosition = (startHour - 8) * 80 + (startMinute / 60) * 80
                            const duration = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 80

                            // Calculate overlapping entries to adjust width
                            const overlaps = filteredSchedule.filter((otherEntry, otherIndex) => {
                              if (index === otherIndex) return false;
                              
                              const otherStartHour = Number.parseInt(otherEntry.startTime.split(":")[0])
                              const otherStartMinute = Number.parseInt(otherEntry.startTime.split(":")[1])
                              const otherEndHour = Number.parseInt(otherEntry.endTime.split(":")[0])
                              const otherEndMinute = Number.parseInt(otherEntry.endTime.split(":")[1])
                              
                              // Check if there's an overlap
                              const entryStart = startHour * 60 + startMinute
                              const entryEnd = endHour * 60 + endMinute
                              const otherStart = otherStartHour * 60 + otherStartMinute
                              const otherEnd = otherEndHour * 60 + otherEndMinute
                              
                              return (entryStart < otherEnd && entryEnd > otherStart)
                            })
                            
                            // Adjust width and position based on overlaps
                            const hasOverlaps = overlaps.length > 0
                            const overlapWidth = hasOverlaps ? (100 / (overlaps.length + 1)) : 100
                            const overlapIndex = hasOverlaps ? overlaps.findIndex(o => 
                              o.startTime < entry.startTime || 
                              (o.startTime === entry.startTime && o.id < entry.id)
                            ) + 1 : 0
                            
                            return (
                              <div
                                key={index}
                                className={`absolute rounded-md p-2 shadow-sm overflow-hidden group transition-all duration-200 hover:shadow-md ${isSelecting ? 'bg-opacity-75 backdrop-blur-[0.5px]' : ''}`}
                                style={{
                                  top: `${startPosition}px`,
                                  height: `${duration}px`,
                                  backgroundColor: entry.color,
                                  zIndex: isSelecting ? 1 : 2, // Base z-index
                                  width: hasOverlaps ? `calc(${overlapWidth}% - 8px)` : 'calc(100% - 16px)',
                                  left: hasOverlaps ? `calc(${overlapIndex * overlapWidth}% + 4px)` : '8px',
                                  transition: 'z-index 0s, transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  // Set a higher z-index on hover
                                  e.currentTarget.style.zIndex = '10';
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  // Reset z-index when not hovering
                                  e.currentTarget.style.zIndex = isSelecting ? '1' : '2';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow">
                                      <div className="text-white text-sm font-medium truncate">{entry.title}</div>
                                      <div className="text-white/80 text-xs truncate">
                                        {entry.startTime} - {entry.endTime} | {entry.room}
                                      </div>
                                      {entry.meetingWith && (
                                        <div className="text-white/80 text-xs truncate mt-1">With: {entry.meetingWith}</div>
                                      )}
                                  </div>
                                  {entry.approved === false && (
                                      <Badge variant="outline" className="ml-1 mr-1 mt-0.5 text-xs bg-yellow-400 text-black border-yellow-500 shrink-0">Pending</Badge>
                                  )}
                                </div>
                                
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 bg-white/20 hover:bg-white/30"
                                        onClick={() => setEditingEntry(entry)}
                                      >
                                        <Edit className="h-3 w-3 text-white" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[550px]">
                                      <DialogHeader>
                                        <DialogTitle>Edit Schedule Entry</DialogTitle>
                                        <DialogDescription>Update the details of this schedule entry</DialogDescription>
                                      </DialogHeader>
                                      {editingEntry && (
                                        <div className="grid gap-4 py-4">
                                          {/* Title and Date */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-title">Title *</Label>
                                              <Input id="edit-title" value={editingEntry.title} onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-date">Date *</Label>
                                              <Input id="edit-date" type="date" value={editingEntry.date} onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })} required />
                                            </div>
                                          </div>
                                          {/* Room and Specific Location */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-room">Room *</Label>
                                              <Select value={editingEntry.room} onValueChange={(value: RoomType) => setEditingEntry({ ...editingEntry, room: value })}>
                                                <SelectTrigger id="edit-room"><SelectValue placeholder="Select room" /></SelectTrigger>
                                                <SelectContent>
                                                  {availableRooms.map(roomName => (<SelectItem key={roomName} value={roomName}>{roomName}</SelectItem>))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-location">Specific Location (Optional)</Label>
                                              <Input id="edit-location" value={editingEntry.location || ""} onChange={(e) => setEditingEntry({ ...editingEntry, location: e.target.value })} />
                                            </div>
                                          </div>
                                          {/* Start Time and End Time */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-start-time">Start Time *</Label>
                                              <Input id="edit-start-time" type="time" value={editingEntry.startTime} onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-end-time">End Time *</Label>
                                              <Input id="edit-end-time" type="time" value={editingEntry.endTime} onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })} required />
                                            </div>
                                          </div>
                                          {/* Meeting Type and Status */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-type">Meeting Type *</Label>
                                              <Select value={editingEntry.type} onValueChange={(value) => { const defaultColor = meetingTypeColors[value as keyof typeof meetingTypeColors] || "#4f46e5"; setEditingEntry({ ...editingEntry, type: value, color: defaultColor }); }}>
                                                <SelectTrigger id="edit-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="meeting">Meeting</SelectItem>
                                                  <SelectItem value="appointment">Appointment</SelectItem>
                                                  <SelectItem value="event">Event</SelectItem>
                                                  <SelectItem value="class">Class</SelectItem>
                                                  <SelectItem value="office-hours">Office Hours</SelectItem>
                                                  <SelectItem value="unavailable">Unavailable</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-status">Status *</Label>
                                              <Select value={editingEntry.status} onValueChange={(value) => setEditingEntry({ ...editingEntry, status: value })}>
                                                <SelectTrigger id="edit-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                                  <SelectItem value="tentative">Tentative</SelectItem>
                                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                          {/* Approved Status - visible to all, but conditionally disabled based on role and current status */}
                                          <div className="space-y-2">
                                              <Label htmlFor="edit-approved">Approval Status</Label>
                                              <Select
                                                  value={editingEntry.approved === undefined ? "true" : String(editingEntry.approved)}
                                                  onValueChange={(value) => setEditingEntry({ ...editingEntry, approved: value === "true" })}
                                                  disabled={session?.user?.role === "admin" && editingEntry.approved === false}
                                              >
                                                  <SelectTrigger id="edit-approved">
                                                      <SelectValue placeholder="Set approval status" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="true">Approved</SelectItem>
                                                      <SelectItem value="false">Pending Approval</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                              {session?.user?.role === "admin" && editingEntry.approved === false && (
                                                <p className="text-xs text-muted-foreground">
                                                  This entry is pending approval. Admins cannot directly approve it here if it was auto-set due to a conflict.
                                                </p>
                                              )}
                                          </div>
                                          {/* Color Picker */}
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-color">Color</Label>
                                            <div className="flex flex-col gap-2">
                                              <div className="flex gap-2">
                                                <Input id="edit-color" type="color" value={editingEntry.color} onChange={(e) => setEditingEntry({ ...editingEntry, color: e.target.value })} className="w-12 h-10 p-1"/>
                                                <Input value={editingEntry.color} onChange={(e) => setEditingEntry({ ...editingEntry, color: e.target.value })} className="flex-1"/>
                                              </div>
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {predefinedColors.map((color) => (<button key={color.value} type="button" className={`w-8 h-8 rounded-full border ${editingEntry.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'}`} style={{ backgroundColor: color.value }} title={color.name} onClick={() => setEditingEntry({ ...editingEntry, color: color.value })}/>))}
                                              </div>
                                            </div>
                                          </div>
                                          {/* Meeting With, Location (Specific), Description */}
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-meeting-with">Meeting With</Label>
                                            <Input id="edit-meeting-with" value={editingEntry.meetingWith || ""} onChange={(e) => setEditingEntry({ ...editingEntry, meetingWith: e.target.value })}/>
                                          </div>
                                          {/* Specific Location field is already part of a grid above */}
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-description">Description</Label>
                                            <Textarea id="edit-description" value={editingEntry.description || ""} onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })} rows={3}/>
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingEntry(null)} disabled={isSubmitting}>Cancel</Button>
                                        <Button onClick={handleUpdateEntry} disabled={isSubmitting} className={isSubmitting ? "opacity-80" : ""}>
                                          {isSubmitting ? (<><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>Updating...</>) : ("Update Entry")}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/20 hover:bg-white/30" onClick={() => confirmDelete(entry.id)}>
                                    <Trash2 className="h-3 w-3 text-white" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[600px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      {filteredSchedule.length > 0 ? (
                        <div className="space-y-4">
                          {filteredSchedule.map((entry, index) => (
                            <div
                              key={index}
                              className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 group"
                            >
                              <div
                                className="w-4 h-full rounded-full mr-3 flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                              ></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-medium">{entry.title}</h3>
                                  <div className="flex items-center gap-2">
                                     {entry.approved === false && (
                                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">Pending Approval</Badge>
                                    )}
                                    <Badge
                                      variant={
                                        entry.status === "confirmed" ? "default"
                                        : entry.status === "tentative" ? "outline"
                                        : "destructive"
                                      }
                                    >
                                      {entry.status}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                                 <p className="text-sm text-gray-700">
                                  <span className="font-medium">Room:</span> {entry.room}
                                </p>
                                {entry.meetingWith && (
                                  <p className="text-sm text-gray-700 mt-2">
                                    <span className="font-medium">With:</span> {entry.meetingWith}
                                  </p>
                                )}
                                {entry.location && (
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Specific Location:</span> {entry.location}
                                  </p>
                                )}
                                {entry.description && <p className="text-sm text-gray-700 mt-2">{entry.description}</p>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingEntry(entry)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[550px]">
                                      <DialogHeader>
                                        <DialogTitle>Edit Schedule Entry</DialogTitle>
                                        <DialogDescription>Update the details of this schedule entry</DialogDescription>
                                      </DialogHeader>
                                      {editingEntry && (
                                        <div className="grid gap-4 py-4">
                                          {/* Title and Date */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-title">Title *</Label>
                                              <Input id="edit-title" value={editingEntry.title} onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-date">Date *</Label>
                                              <Input id="edit-date" type="date" value={editingEntry.date} onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })} required />
                                            </div>
                                          </div>
                                          {/* Room and Specific Location */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-room">Room *</Label>
                                              <Select value={editingEntry.room} onValueChange={(value: RoomType) => setEditingEntry({ ...editingEntry, room: value })}>
                                                <SelectTrigger id="edit-room"><SelectValue placeholder="Select room" /></SelectTrigger>
                                                <SelectContent>
                                                  {availableRooms.map(roomName => (<SelectItem key={roomName} value={roomName}>{roomName}</SelectItem>))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-location">Specific Location (Optional)</Label>
                                              <Input id="edit-location" value={editingEntry.location || ""} onChange={(e) => setEditingEntry({ ...editingEntry, location: e.target.value })} />
                                            </div>
                                          </div>
                                          {/* Start Time and End Time */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-start-time">Start Time *</Label>
                                              <Input id="edit-start-time" type="time" value={editingEntry.startTime} onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-end-time">End Time *</Label>
                                              <Input id="edit-end-time" type="time" value={editingEntry.endTime} onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })} required />
                                            </div>
                                          </div>
                                          {/* Meeting Type and Status */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-type">Meeting Type *</Label>
                                              <Select value={editingEntry.type} onValueChange={(value) => { const defaultColor = meetingTypeColors[value as keyof typeof meetingTypeColors] || "#4f46e5"; setEditingEntry({ ...editingEntry, type: value, color: defaultColor }); }}>
                                                <SelectTrigger id="edit-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="meeting">Meeting</SelectItem>
                                                  <SelectItem value="appointment">Appointment</SelectItem>
                                                  <SelectItem value="event">Event</SelectItem>
                                                  <SelectItem value="class">Class</SelectItem>
                                                  <SelectItem value="office-hours">Office Hours</SelectItem>
                                                  <SelectItem value="unavailable">Unavailable</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-status">Status *</Label>
                                              <Select value={editingEntry.status} onValueChange={(value) => setEditingEntry({ ...editingEntry, status: value })}>
                                                <SelectTrigger id="edit-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                                  <SelectItem value="tentative">Tentative</SelectItem>
                                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                           {/* Approved Status - visible to all, but conditionally disabled based on role and current status */}
                                          <div className="space-y-2">
                                              <Label htmlFor="edit-approved">Approval Status</Label>
                                              <Select
                                                  value={editingEntry.approved === undefined ? "true" : String(editingEntry.approved)}
                                                  onValueChange={(value) => setEditingEntry({ ...editingEntry, approved: value === "true" })}
                                                  disabled={session?.user?.role === "admin" && editingEntry.approved === false}
                                              >
                                                  <SelectTrigger id="edit-approved">
                                                      <SelectValue placeholder="Set approval status" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="true">Approved</SelectItem>
                                                      <SelectItem value="false">Pending Approval</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                              {session?.user?.role === "admin" && editingEntry.approved === false && (
                                                <p className="text-xs text-muted-foreground">
                                                  This entry is pending approval. Admins cannot directly approve it here if it was auto-set due to a conflict.
                                                </p>
                                              )}
                                          </div>
                                          {/* Color Picker */}
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-color">Color</Label>
                                            <div className="flex flex-col gap-2">
                                              <div className="flex gap-2">
                                                <Input id="edit-color" type="color" value={editingEntry.color} onChange={(e) => setEditingEntry({ ...editingEntry, color: e.target.value })} className="w-12 h-10 p-1"/>
                                                <Input value={editingEntry.color} onChange={(e) => setEditingEntry({ ...editingEntry, color: e.target.value })} className="flex-1"/>
                                              </div>
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {predefinedColors.map((color) => (<button key={color.value} type="button" className={`w-8 h-8 rounded-full border ${editingEntry.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'}`} style={{ backgroundColor: color.value }} title={color.name} onClick={() => setEditingEntry({ ...editingEntry, color: color.value })}/>))}
                                              </div>
                                            </div>
                                          </div>
                                          {/* Meeting With, Description */}
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-meeting-with">Meeting With</Label>
                                            <Input id="edit-meeting-with" value={editingEntry.meetingWith || ""} onChange={(e) => setEditingEntry({ ...editingEntry, meetingWith: e.target.value })}/>
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-description">Description</Label>
                                            <Textarea id="edit-description" value={editingEntry.description || ""} onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })} rows={3}/>
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingEntry(null)} disabled={isSubmitting}>Cancel</Button>
                                        <Button onClick={handleUpdateEntry} disabled={isSubmitting} className={isSubmitting ? "opacity-80" : ""}>
                                          {isSubmitting ? (<><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>Updating...</>) : ("Update Entry")}
                                        </Button>
                                      </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => confirmDelete(entry.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-500">No schedule entries found for the selected filters.</p>
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => entryToDelete && handleDeleteEntry(entryToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
// The fetchScheduleData function name was changed to fetchScheduleDataForComponent
// to avoid conflicts with the global fetch. This needs to be consistent.
// The previous diffs also introduced `currentRoomFilter` and `availableRooms` which are expected here.
// The `ScheduleEntry` type from `lib/types` is assumed to be updated with `room` and `approved`.

