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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import type { ScheduleEntry } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export default function AdminView() {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [meetingType, setMeetingType] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("all")
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    location: "",
    description: "",
  })

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      setIsLoading(true)
      try {
        let url = "/api/schedule"
        if (date) {
          const formattedDate = date.toISOString().split("T")[0]
          url += `?date=${formattedDate}`
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

    fetchScheduleData()
  }, [date])

  // Filter schedule data based on selected filters
  const filteredSchedule = scheduleData.filter((entry) => {
    const entryDate = new Date(entry.date)
    const selectedDate = date ? new Date(date) : new Date()

    const sameDay =
      entryDate.getDate() === selectedDate.getDate() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getFullYear() === selectedDate.getFullYear()

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

    return sameDay && meetingTypeMatch && timeRangeMatch
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

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.date || !newEntry.startTime || !newEntry.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

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

      const createdEntry = await response.json()

      // Reset form
      setNewEntry({
        title: "",
        date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        startTime: "08:00",
        endTime: "09:00",
        type: "meeting",
        status: "confirmed",
        color: "#4f46e5",
        meetingWith: "",
        location: "",
        description: "",
      })

      setIsDialogOpen(false)

      // Fetch updated schedule data to refresh the calendar
      const formattedDate = newEntry.date
      const fetchUrl = `/api/schedule?date=${formattedDate}`
      const refreshResponse = await fetch(fetchUrl)
      
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setScheduleData(refreshedData)
      } else {
        // If refresh fails, at least update local state with the new entry
        setScheduleData((prev) => [...prev, createdEntry])
      }

      toast({
        title: "Success",
        description: "Schedule entry created successfully",
      })
    } catch (error) {
      console.error("Error creating schedule entry:", error)
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

      const updatedEntry = await response.json()
      
      // Fetch updated schedule data to refresh the calendar
      const formattedDate = editingEntry.date
      const fetchUrl = `/api/schedule?date=${formattedDate}`
      const refreshResponse = await fetch(fetchUrl)
      
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setScheduleData(refreshedData)
      } else {
        // If refresh fails, at least update local state with the updated entry
        setScheduleData((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
      }

      setEditingEntry(null)

      toast({
        title: "Success",
        description: "Schedule entry updated successfully",
      })
    } catch (error) {
      console.error("Error updating schedule entry:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
    }
  }

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

    // Set start and end times based on selection
    setNewEntry((prev) => ({
      ...prev,
      date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      startTime: sortedSlots[0],
      endTime: sortedSlots[sortedSlots.length - 1],
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
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                    <Select value={newEntry.type} onValueChange={(value) => setNewEntry({ ...newEntry, type: value })}>
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
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEntry.location}
                    onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                    placeholder="Meeting location"
                  />
                </div>
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
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Meeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Appointment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Unavailable</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Principal's Schedule for {date ? formatDate(date) : "Today"}
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
                                    className={`absolute left-0 right-0 top-0 h-[50%] cursor-pointer hover:bg-blue-100 ${
                                      selectedTimeSlots.includes(`${hour.toString().padStart(2, "0")}:00`)
                                        ? "bg-blue-200"
                                        : ""
                                    }`}
                                    onClick={() => handleTimeSlotClick(`${hour.toString().padStart(2, "0")}:00`)}
                                  ></div>
                                  <div
                                    className={`absolute left-0 right-0 top-[50%] h-[50%] cursor-pointer hover:bg-blue-100 ${
                                      selectedTimeSlots.includes(`${hour.toString().padStart(2, "0")}:30`)
                                        ? "bg-blue-200"
                                        : ""
                                    }`}
                                    onClick={() => handleTimeSlotClick(`${hour.toString().padStart(2, "0")}:30`)}
                                  ></div>
                                </>
                              )}
                            </div>
                          )
                        })}

                        {/* Schedule entries */}
                        {!isSelecting &&
                          filteredSchedule.map((entry, index) => {
                            const startHour = Number.parseInt(entry.startTime.split(":")[0])
                            const startMinute = Number.parseInt(entry.startTime.split(":")[1])
                            const endHour = Number.parseInt(entry.endTime.split(":")[0])
                            const endMinute = Number.parseInt(entry.endTime.split(":")[1])

                            const startPosition = (startHour - 8) * 80 + (startMinute / 60) * 80
                            const duration = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 80

                            return (
                              <div
                                key={index}
                                className="absolute left-2 right-2 rounded-md p-2 shadow-sm overflow-hidden group"
                                style={{
                                  top: `${startPosition}px`,
                                  height: `${duration}px`,
                                  backgroundColor: entry.color,
                                }}
                              >
                                <div className="text-white text-sm font-medium truncate">{entry.title}</div>
                                <div className="text-white/80 text-xs truncate">
                                  {entry.startTime} - {entry.endTime}
                                </div>
                                {entry.meetingWith && (
                                  <div className="text-white/80 text-xs truncate mt-1">With: {entry.meetingWith}</div>
                                )}
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
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-title">Title *</Label>
                                              <Input
                                                id="edit-title"
                                                value={editingEntry.title}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, title: e.target.value })
                                                }
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-date">Date *</Label>
                                              <Input
                                                id="edit-date"
                                                type="date"
                                                value={editingEntry.date}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, date: e.target.value })
                                                }
                                                required
                                              />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-start-time">Start Time *</Label>
                                              <Input
                                                id="edit-start-time"
                                                type="time"
                                                value={editingEntry.startTime}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, startTime: e.target.value })
                                                }
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-end-time">End Time *</Label>
                                              <Input
                                                id="edit-end-time"
                                                type="time"
                                                value={editingEntry.endTime}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, endTime: e.target.value })
                                                }
                                                required
                                              />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-type">Meeting Type *</Label>
                                              <Select
                                                value={editingEntry.type}
                                                onValueChange={(value) =>
                                                  setEditingEntry({ ...editingEntry, type: value })
                                                }
                                              >
                                                <SelectTrigger id="edit-type">
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
                                              <Label htmlFor="edit-status">Status *</Label>
                                              <Select
                                                value={editingEntry.status}
                                                onValueChange={(value) =>
                                                  setEditingEntry({ ...editingEntry, status: value })
                                                }
                                              >
                                                <SelectTrigger id="edit-status">
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
                                            <Label htmlFor="edit-color">Color</Label>
                                            <div className="flex gap-2">
                                              <Input
                                                id="edit-color"
                                                type="color"
                                                value={editingEntry.color}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, color: e.target.value })
                                                }
                                                className="w-12 h-10 p-1"
                                              />
                                              <Input
                                                value={editingEntry.color}
                                                onChange={(e) =>
                                                  setEditingEntry({ ...editingEntry, color: e.target.value })
                                                }
                                                className="flex-1"
                                              />
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-meeting-with">Meeting With</Label>
                                            <Input
                                              id="edit-meeting-with"
                                              value={editingEntry.meetingWith || ""}
                                              onChange={(e) =>
                                                setEditingEntry({ ...editingEntry, meetingWith: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-location">Location</Label>
                                            <Input
                                              id="edit-location"
                                              value={editingEntry.location || ""}
                                              onChange={(e) =>
                                                setEditingEntry({ ...editingEntry, location: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-description">Description</Label>
                                            <Textarea
                                              id="edit-description"
                                              value={editingEntry.description || ""}
                                              onChange={(e) =>
                                                setEditingEntry({ ...editingEntry, description: e.target.value })
                                              }
                                              rows={3}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button
                                          variant="outline"
                                          onClick={() => setEditingEntry(null)}
                                          disabled={isSubmitting}
                                        >
                                          Cancel
                                        </Button>
                                        <Button onClick={handleUpdateEntry} disabled={isSubmitting}>
                                          {isSubmitting ? "Updating..." : "Update Entry"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 bg-white/20 hover:bg-white/30"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
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
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{entry.title}</h3>
                                  <Badge
                                    variant={
                                      entry.status === "confirmed"
                                        ? "default"
                                        : entry.status === "tentative"
                                          ? "outline"
                                          : "destructive"
                                    }
                                  >
                                    {entry.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                                {entry.meetingWith && (
                                  <p className="text-sm text-gray-700 mt-2">
                                    <span className="font-medium">With:</span> {entry.meetingWith}
                                  </p>
                                )}
                                {entry.location && (
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Location:</span> {entry.location}
                                  </p>
                                )}
                                {entry.description && <p className="text-sm text-gray-700 mt-2">{entry.description}</p>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingEntry(entry)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[550px]">
                                    <DialogHeader>
                                      <DialogTitle>Edit Schedule Entry</DialogTitle>
                                      <DialogDescription>Update the details of this schedule entry</DialogDescription>
                                    </DialogHeader>
                                    {/* Edit form content is the same as above */}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
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
    </div>
  )
}

