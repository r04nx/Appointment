"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, Info, CalendarIcon, Clock, MapPin, Users, BookOpen } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/utils"
import type { ScheduleEntry } from "@/lib/types"

export default function PublicView() {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [meetingType, setMeetingType] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("all")

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
        // Fallback to sample data if API fails
        setScheduleData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchScheduleData()
  }, [date])

  return (
    <div className="space-y-6">
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
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
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
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div key={i} className="h-20 border-b border-gray-100 relative">
                            <div className="absolute left-0 right-0 h-px bg-gray-200 top-0"></div>
                          </div>
                        ))}

                        {/* Schedule entries */}
                        {filteredSchedule.map((entry, index) => {
                          const startHour = Number.parseInt(entry.startTime.split(":")[0])
                          const startMinute = Number.parseInt(entry.startTime.split(":")[1])
                          const endHour = Number.parseInt(entry.endTime.split(":")[0])
                          const endMinute = Number.parseInt(entry.endTime.split(":")[1])

                          const startPosition = (startHour - 8) * 80 + (startMinute / 60) * 80
                          const duration = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 80

                          return (
                            <div
                              key={index}
                              className="absolute left-2 right-2 rounded-md p-2 shadow-sm overflow-hidden"
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
                              className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                            >
                              <div
                                className="w-4 h-full rounded-full mr-3 flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                              ></div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{entry.title}</h3>
                                  <Badge variant="outline">{entry.type}</Badge>
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
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent>
                                  <SheetHeader>
                                    <SheetTitle>{entry.title}</SheetTitle>
                                    <SheetDescription>
                                      {formatDate(new Date(entry.date))} • {entry.startTime} - {entry.endTime}
                                    </SheetDescription>
                                  </SheetHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                        Meeting Type
                                      </h4>
                                      <p className="text-sm text-gray-500">{entry.type}</p>
                                    </div>
                                    {entry.meetingWith && (
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                          <Users className="h-4 w-4 text-blue-600" />
                                          Meeting With
                                        </h4>
                                        <p className="text-sm text-gray-500">{entry.meetingWith}</p>
                                      </div>
                                    )}
                                    {entry.location && (
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-blue-600" />
                                          Location
                                        </h4>
                                        <p className="text-sm text-gray-500">{entry.location}</p>
                                      </div>
                                    )}
                                    {entry.description && (
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-medium">Description</h4>
                                        <p className="text-sm text-gray-500">{entry.description}</p>
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium">Status</h4>
                                      <p className="text-sm text-gray-500">{entry.status}</p>
                                    </div>
                                  </div>
                                </SheetContent>
                              </Sheet>
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

