"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRange } from "react-day-picker"
import { addDays, format, isSameDay, isWithinInterval, parseISO } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash, 
  LayoutGrid, 
  List, 
  CalendarIcon, 
  Filter, 
  Download, 
  Copy, 
  Plus,
  Search,
  RefreshCw,
  X,
  FileText,
  Clock,
  Users,
  Calendar as CalendarIconSolid
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppointments } from "@/hooks/use-appointments"
import { formatTime, getWeekDates, formatDateToYYYYMMDD } from "@/lib/utils"
import Loading from "@/components/loading"

// Define Appointment type
type Appointment = {
  id?: string;
  date: string;
  time: string;
  status: "available" | "booked";
  with?: string;
  endTime?: string;
  duration?: number; // Duration in minutes
};

export default function AdminCalendar() {
  const [date, setDate] = useState<Date>(new Date())
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments()
  const [colorScheme, setColorScheme] = useState<"blue" | "red" | "purple" | "green">("blue")
  const [editingAppointment, setEditingAppointment] = useState<{
    id?: string;
    date: string;
    time: string;
    status: "available" | "booked";
    with?: string;
    endTime?: string;
    duration?: number;
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day")
  const [isCompact, setIsCompact] = useState(true) // Default to compact mode
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  })
  const [timeRange, setTimeRange] = useState<{start: string, end: string}>({ 
    start: "08:00", 
    end: "22:00" 
  })
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past" | "booked" | "available">("all")
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false)
  const weekDates = getWeekDates(new Date(date))

  // Function to export appointments to CSV
  const exportToCSV = () => {
    // Filter appointments based on current filters
    const appointmentsToExport = filteredAppointments;
    
    // Create CSV header
    const csvHeader = ["Date", "Time", "Status", "Meeting With", "End Time"].join(",");
    
    // Create CSV rows
    const csvRows = appointmentsToExport.map(appointment => {
      const date = new Date(parseISO(appointment.date)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      const time = formatTime(appointment.time);
      const status = appointment.status === "booked" ? "Booked" : "Available";
      const with_ = appointment.with || "";
      const endTime = appointment.endTime ? formatTime(appointment.endTime) : "";
      
      return [date, time, status, with_, endTime].join(",");
    }).join("\n");
    
    // Combine header and rows
    const csvContent = `${csvHeader}\n${csvRows}`;
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `principal-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${appointmentsToExport.length} appointments exported to CSV.`,
    });
  };

  // Generate time slots from 8 AM to 10 PM with 30-minute intervals
  const timeSlots = Array.from({ length: 29 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = i % 2 === 0 ? "00" : "30"
    
    // Calculate the end time (30 minutes later)
    let nextHour = hour
    let nextMinute = parseInt(minute) + 30
    
    if (nextMinute >= 60) {
      nextHour += 1
      nextMinute -= 60
    }
    
    const nextMinuteStr = nextMinute === 0 ? "00" : nextMinute.toString()
    
    return {
      start: `${hour}:${minute}`,
      end: `${nextHour}:${nextMinuteStr}`,
      displayTime: `${formatTime(`${hour}:${minute}`)} - ${formatTime(`${nextHour}:${nextMinuteStr}`)}`,
    }
  })

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getAppointmentForSlot = (slot: string, dateStr: string = date.toISOString().split("T")[0]) => {
    return appointments.find((apt) => apt.date === dateStr && apt.time === slot)
  }

  const handleEditAppointment = (slot: string, dateStr: string = date.toISOString().split("T")[0]) => {
    // If multi-select is active and we have selected slots, use those instead
    if (isMultiSelectActive && selectedTimeSlots.length > 0) {
      // Sort the selected time slots
      const sortedSlots = [...selectedTimeSlots].sort((a, b) => {
        const [aHour, aMinute] = a.split(":").map(Number)
        const [bHour, bMinute] = b.split(":").map(Number)
        return (aHour * 60 + aMinute) - (bHour * 60 + bMinute)
      })
      
      // Get the first and last slots
      const firstSlot = sortedSlots[0]
      const lastSlot = sortedSlots[sortedSlots.length - 1]
      
      // Calculate the end time based on the last slot
      const [lastHour, lastMinute] = lastSlot.split(":").map(Number)
      let endHour = lastHour
      let endMinute = lastMinute + 30
      
      if (endMinute >= 60) {
        endHour += 1
        endMinute -= 60
      }
      
      const endTime = `${endHour}:${endMinute === 0 ? "00" : endMinute}`
      
      // Calculate duration in minutes
      const [firstHour, firstMinute] = firstSlot.split(":").map(Number)
      const startMinutes = firstHour * 60 + firstMinute
      const endMinutes = endHour * 60 + endMinute
      const duration = endMinutes - startMinutes
      
      setEditingAppointment({
        id: Date.now().toString(),
        date: dateStr,
        time: firstSlot,
        endTime: endTime,
        status: "available",
        with: "",
        duration: duration
      })
      
      // Clear selected slots after creating the appointment
      setSelectedTimeSlots([])
      setIsMultiSelectActive(false)
    } else {
      const appointment = getAppointmentForSlot(slot, dateStr)

      if (appointment) {
        setEditingAppointment(appointment)
      } else {
        // Calculate end time (30 minutes after start)
        const [hour, minute] = slot.split(":")
        let endHour = Number.parseInt(hour)
        let endMinute = Number.parseInt(minute) + 30

        if (endMinute >= 60) {
          endHour += 1
          endMinute -= 60
        }

        const endTime = `${endHour}:${endMinute === 0 ? "00" : endMinute}`

        setEditingAppointment({
          id: Date.now().toString(),
          date: dateStr,
          time: slot,
          endTime: endTime,
          status: "available",
          with: "",
          duration: 30 // Default 30 minutes
        })
      }
    }

    setIsDialogOpen(true)
  }

  const handleSaveAppointment = async () => {
    if (!editingAppointment) return

    const existingAppointment = getAppointmentForSlot(editingAppointment.time, editingAppointment.date)

    if (existingAppointment) {
      if (editingAppointment.id) {
        await updateAppointment(editingAppointment.id, editingAppointment)
      }
    } else {
      await addAppointment(editingAppointment)
    }

    setIsDialogOpen(false)
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = () => {
    if (!editingAppointment || !editingAppointment.id) return

    deleteAppointment(editingAppointment.id)
    setIsDialogOpen(false)
    setEditingAppointment(null)
  }

  const getColorClass = (status: string | undefined) => {
    if (!status) return ""

    switch (colorScheme) {
      case "blue":
        return status === "booked"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "red":
        return status === "booked"
          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "purple":
        return status === "booked"
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "green":
        return status === "booked"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return status === "booked"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  // Filter appointments based on all criteria
  const filteredAppointments = appointments.filter((appointment) => {
    // Date filtering based on view mode
    const appointmentDate = new Date(appointment.date)
    let isMatchingDate = false
    
    if (viewMode === "day") {
      isMatchingDate = isSameDay(appointmentDate, date)
    } else if (viewMode === "week") {
      isMatchingDate = getWeekDates(date).some(d => isSameDay(d, appointmentDate))
    } else if (viewMode === "month") {
      isMatchingDate = appointmentDate.getMonth() === date.getMonth() && 
                      appointmentDate.getFullYear() === date.getFullYear()
    }
    
    // Date range filtering (if active)
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (dateRange.from && dateRange.to && isWithinInterval(appointmentDate, {
        start: dateRange.from,
        end: dateRange.to
      }))
    
    // Time range filtering
    const [hours, minutes] = appointment.time.split(':').map(Number)
    const appointmentMinutes = hours * 60 + minutes
    
    const [startHours, startMinutes] = timeRange.start.split(':').map(Number)
    const [endHours, endMinutes] = timeRange.end.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    
    const isWithinTimeRange = appointmentMinutes >= startTotalMinutes && appointmentMinutes <= endTotalMinutes
    
    // Status filtering
    const isMatchingStatus = 
      statusFilter === "all" || 
      (statusFilter === "booked" && appointment.status === "booked") ||
      (statusFilter === "available" && appointment.status === "available") ||
      (statusFilter === "upcoming" && appointmentDate >= new Date(new Date().setHours(0, 0, 0, 0))) ||
      (statusFilter === "past" && appointmentDate < new Date(new Date().setHours(0, 0, 0, 0)))
    
    // Text search - only search in fields that exist in the Appointment model
    const matchesSearch = searchQuery === "" || 
      appointment.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appointment.with && appointment.with.toLowerCase().includes(searchQuery.toLowerCase())) ||
      appointment.date.includes(searchQuery)

    return isMatchingDate && matchesDateRange && isWithinTimeRange && isMatchingStatus && matchesSearch
  })

  // Handle viewing appointment details
  const handleViewAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailModalOpen(true)
  }

  // Render the filter panel
  const renderFilterPanel = () => {
    return (
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[350px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>Filter Appointments</SheetTitle>
            <SheetDescription>
              Customize your view with advanced filtering options
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={"outline"}
                    className={"w-full justify-start text-left font-normal"}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-range">Time Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="time-start"
                  type="time"
                  value={timeRange.start}
                  onChange={(e) => setTimeRange({...timeRange, start: e.target.value})}
                  className="w-full"
                />
                <span>to</span>
                <Input
                  id="time-end"
                  type="time"
                  value={timeRange.end}
                  onChange={(e) => setTimeRange({...timeRange, end: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "upcoming" | "past" | "booked" | "available")}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDateRange(undefined);
                setTimeRange({ start: "08:00", end: "22:00" });
                setStatusFilter("all");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </Button>
            <SheetClose asChild>
              <Button type="submit">Apply Filters</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };

  const renderDayView = () => {
    const dateStr = date.toISOString().split("T")[0]

    return (
      <Card className="shadow-md border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIconSolid className="h-5 w-5 text-primary" />
              {formattedDate}
            </CardTitle>
            <CardDescription>
              {filteredAppointments.length} appointments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(date)
                      newDate.setDate(newDate.getDate() - 1)
                      setDate(newDate)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous Day</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setDate(newDate.getDate() + 1)
                setDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {timeSlots.map((slot) => {
              const appointment = getAppointmentForSlot(slot.start, dateStr)
              return (
                <div
                  key={slot.start}
                  className={cn(
                    "flex items-center justify-between rounded-md border p-2 hover:bg-accent/30 transition-colors", 
                    isCompact && "py-1",
                    isMultiSelectActive && selectedTimeSlots.includes(slot.start) && "bg-primary/20 border-primary"
                  )}
                  onClick={() => {
                    if (isMultiSelectActive) {
                      // Toggle selection of this time slot
                      if (selectedTimeSlots.includes(slot.start)) {
                        setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot.start))
                      } else {
                        setSelectedTimeSlots([...selectedTimeSlots, slot.start])
                      }
                    } else if (!appointment) {
                      // If not in multi-select mode and no appointment exists, edit this slot
                      handleEditAppointment(slot.start, dateStr)
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {isMultiSelectActive && (
                      <Checkbox 
                        checked={selectedTimeSlots.includes(slot.start)}
                        className="mr-1"
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTimeSlots([...selectedTimeSlots, slot.start])
                          } else {
                            setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot.start))
                          }
                        }}
                      />
                    )}
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={cn("font-medium text-sm")}>
                      {formatTime(slot.start)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {appointment && (
                      <Badge
                        variant="outline"
                        className={cn(getColorClass(appointment?.status), "text-xs py-0")}
                      >
                        {appointment?.status === "booked" ? "Booked" : "Available"}
                      </Badge>
                    )}
                    {appointment?.status === "booked" && appointment.with && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">{appointment.with}</span>
                    )}
                    {appointment && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-primary/10 rounded-full" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditAppointment(slot.start, dateStr)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWeekView = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Week of {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setDate(newDate.getDate() - 7)
                setDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setDate(newDate.getDate() + 7)
                setDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-1">
              {/* Time column */}
              <div className="pt-8 pr-2 border-r">
                {isCompact
                  ? // Compact view - show fewer time slots
                    Array.from({ length: 14 }, (_, i) => {
                      const hour = i + 8
                      return (
                        <div key={hour} className="h-10 text-right text-sm font-medium">
                          {hour > 12 ? hour - 12 : hour}
                          {hour >= 12 ? "PM" : "AM"}
                        </div>
                      )
                    })
                  : // Full view - show all half-hour slots
                    timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-10 text-right text-sm font-medium",
                          index % 2 === 1 && "text-muted-foreground text-xs",
                        )}
                      >
                        {index % 2 === 0 && formatTime(slot.start)}
                      </div>
                    ))}
              </div>

              {/* Days columns */}
              {weekDates.map((weekDate, dayIndex) => {
                const dateStr = formatDateToYYYYMMDD(weekDate)
                const isToday = new Date().toDateString() === weekDate.toDateString()

                return (
                  <div key={dayIndex} className="flex flex-col">
                    <div className={cn("text-center py-2 font-medium border-b", isToday && "bg-primary/10")}>
                      <div>{weekDate.toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div className={cn("text-sm", isToday && "font-bold")}>{weekDate.getDate()}</div>
                    </div>

                    <div className="flex flex-col">
                      {isCompact
                        ? // Compact view - show hour blocks
                          Array.from({ length: 14 }, (_, i) => {
                            const hour = i + 8
                            const hourStr = `${hour}:00`
                            const appointment = getAppointmentForSlot(hourStr, dateStr)
                            const nextAppointment = getAppointmentForSlot(`${hour}:30`, dateStr)

                            // If either half-hour has an appointment, show as booked
                            const isBooked = appointment?.status === "booked" || nextAppointment?.status === "booked"

                            return (
                              <div
                                key={hour}
                                className={cn(
                                  "h-10 border-b border-r p-1 relative",
                                  isBooked && getColorClass("booked"),
                                )}
                                onClick={() => handleEditAppointment(hourStr, dateStr)}
                              >
                                {isBooked && (
                                  <div className="text-xs truncate">{appointment?.with || nextAppointment?.with}</div>
                                )}
                                <button className="absolute top-0 right-0 p-1 opacity-0 hover:opacity-100 transition-opacity">
                                  <Edit className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })
                        : // Full view - show all half-hour slots
                          timeSlots.map((slot, index) => {
                            const appointment = getAppointmentForSlot(slot.start, dateStr)

                            return (
                              <div
                                key={index}
                                className={cn(
                                  "h-10 border-b border-r p-1 relative",
                                  appointment?.status === "booked" && getColorClass("booked"),
                                )}
                                onClick={() => handleEditAppointment(slot.start, dateStr)}
                              >
                                {appointment?.status === "booked" && (
                                  <div className="text-xs truncate">{appointment.with}</div>
                                )}
                                <button className="absolute top-0 right-0 p-1 opacity-0 hover:opacity-100 transition-opacity">
                                  <Edit className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render month view
  const renderMonthView = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setMonth(newDate.getMonth() - 1)
                setDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setMonth(newDate.getMonth() + 1)
                setDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium p-2 text-sm">
                {day}
              </div>
            ))}
            
            {(() => {
              const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
              const startDate = new Date(monthStart)
              startDate.setDate(startDate.getDate() - startDate.getDay())
              
              const days = []
              const currentDate = new Date()
              
              for (let i = 0; i < 42; i++) {
                const day = new Date(startDate)
                day.setDate(startDate.getDate() + i)
                const dateStr = formatDateToYYYYMMDD(day)
                const isCurrentMonth = day.getMonth() === date.getMonth()
                const isToday = day.toDateString() === currentDate.toDateString()
                
                // Get appointments for this day
                const dayAppointments = filteredAppointments.filter(apt => apt.date === dateStr)
                const hasBookedAppointments = dayAppointments.some(apt => apt.status === "booked")
                
                days.push(
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[100px] p-1 border relative",
                      !isCurrentMonth && "text-muted-foreground bg-muted/20",
                      isToday && "bg-primary/5 border-primary",
                      "hover:bg-accent/50 cursor-pointer transition-colors"
                    )}
                    onClick={() => {
                      setDate(day)
                      setViewMode("day")
                    }}
                  >
                    <div className="text-right p-1">
                      <span className={cn(
                        "inline-block rounded-full w-7 h-7 text-center leading-7",
                        isToday && "bg-primary text-primary-foreground"
                      )}>
                        {day.getDate()}
                      </span>
                    </div>
                    
                    {isCompact ? (
                      hasBookedAppointments && (
                        <Badge className="absolute bottom-1 left-1 right-1 text-center" variant="outline">
                          {dayAppointments.filter(apt => apt.status === "booked").length} booked
                        </Badge>
                      )
                    ) : (
                      <div className="space-y-1 mt-1 max-h-[70px] overflow-hidden">
                        {dayAppointments.slice(0, 3).map((apt, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "text-xs px-1 py-0.5 rounded truncate",
                              apt.status === "booked" ? getColorClass("booked") : "bg-muted"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditAppointment(apt.time, apt.date)
                            }}
                          >
                            {formatTime(apt.time)}: {apt.with || "Available"}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-0 right-0 h-6 w-6 opacity-0 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditAppointment("09:00", dateStr)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )
              }
              
              return days
            })()}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold">Manage Principal's Schedule</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "day" | "week" | "month")}>
              <TabsList className="h-8">
                <TabsTrigger value="day" className="text-xs px-2">Day</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-1">
            <Label htmlFor="compact-mode" className="flex cursor-pointer items-center gap-1 text-xs">
              <Checkbox
                id="compact-mode"
                checked={isCompact}
                className="h-4 w-4"
                onCheckedChange={(checked) => setIsCompact(checked as boolean)}
              />
              Compact
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Color:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 rounded-full p-0", colorScheme === "blue" && "ring-2 ring-primary")}
                style={{ backgroundColor: "rgb(59, 130, 246)" }}
                onClick={() => setColorScheme("blue")}
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 rounded-full p-0", colorScheme === "red" && "ring-2 ring-primary")}
                style={{ backgroundColor: "rgb(239, 68, 68)" }}
                onClick={() => setColorScheme("red")}
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 rounded-full p-0", colorScheme === "purple" && "ring-2 ring-primary")}
                style={{ backgroundColor: "rgb(168, 85, 247)" }}
                onClick={() => setColorScheme("purple")}
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 rounded-full p-0", colorScheme === "green" && "ring-2 ring-primary")}
                style={{ backgroundColor: "rgb(34, 197, 94)" }}
                onClick={() => setColorScheme("green")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search appointments..."
            className="w-full pl-8 sm:w-[200px] h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-1 h-9 px-3">
              <Filter className="h-4 w-4" />
              Filter
              {(dateRange || timeRange.start !== "08:00" || timeRange.end !== "22:00" || statusFilter !== "all") && (
                <Badge variant="secondary" className="ml-1 text-xs">Active</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[350px] sm:w-[450px]">
            <SheetHeader>
              <SheetTitle>Filter Appointments</SheetTitle>
              <SheetDescription>
                Customize your view with advanced filtering options
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-range"
                      variant={"outline"}
                      className={"w-full justify-start text-left font-normal"}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time-range">Time Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="time-start"
                    type="time"
                    value={timeRange.start}
                    onChange={(e) => setTimeRange({...timeRange, start: e.target.value})}
                    className="w-full"
                  />
                  <span>to</span>
                  <Input
                    id="time-end"
                    type="time"
                    value={timeRange.end}
                    onChange={(e) => setTimeRange({...timeRange, end: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "upcoming" | "past" | "booked" | "available")}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateRange(undefined);
                  setTimeRange({ start: "08:00", end: "22:00" });
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Filters
              </Button>
              <SheetClose asChild>
                <Button type="submit">Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        <Button variant="outline" className="gap-1 h-9 px-3" onClick={exportToCSV}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        
        <Button 
          variant={isMultiSelectActive ? "secondary" : "outline"}
          className="gap-1 h-9 px-3"
          onClick={() => setIsMultiSelectActive(!isMultiSelectActive)}
        >
          {isMultiSelectActive ? (
            <>
              <X className="h-4 w-4" />
              Cancel Multi-select
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Multi-select
            </>
          )}
        </Button>
        
        {isMultiSelectActive && selectedTimeSlots.length > 0 && (
          <Button 
            variant="default" 
            className="gap-1 h-9 px-3 bg-primary hover:bg-primary/90" 
            onClick={() => handleEditAppointment(selectedTimeSlots[0])}
          >
            <Plus className="h-4 w-4" />
            Create ({selectedTimeSlots.length} slots)
          </Button>
        )}
        
        {!isMultiSelectActive && (
          <Button variant="default" className="gap-1 h-9 px-3 bg-primary hover:bg-primary/90" onClick={() => handleEditAppointment("09:00")}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {viewMode === "day" ? renderDayView() : viewMode === "week" ? renderWeekView() : renderMonthView()}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAppointment && getAppointmentForSlot(editingAppointment.time, editingAppointment.date) ? (
                <>
                  <Edit className="h-5 w-5 text-primary" />
                  Edit Appointment
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Add Appointment
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure the appointment details for the principal's schedule
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="appointment-date"
                      variant={"outline"}
                      className={"w-full justify-start text-left font-normal"}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingAppointment.date ? (
                        format(new Date(editingAppointment.date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editingAppointment.date ? new Date(editingAppointment.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditingAppointment({
                            ...editingAppointment,
                            date: format(date, "yyyy-MM-dd")
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Time</Label>
                <Select
                  value={editingAppointment.time}
                  onValueChange={(value) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      time: value,
                    })
                  }
                >
                  <SelectTrigger id="appointment-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 29 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8
                      const minute = i % 2 === 0 ? "00" : "30"
                      const timeValue = `${hour}:${minute}`
                      
                      // Calculate end time (30 minutes later)
                      let endHour = hour
                      let endMinute = parseInt(minute) + 30
                      
                      if (endMinute >= 60) {
                        endHour += 1
                        endMinute -= 60
                      }
                      
                      return (
                        <SelectItem key={timeValue} value={timeValue}>
                          {formatTime(timeValue)} - {formatTime(`${endHour}:${endMinute === 0 ? "00" : endMinute}`)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={editingAppointment.duration?.toString() || "30"}
                  onValueChange={(value) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      duration: parseInt(value),
                      // Recalculate end time based on duration
                      endTime: (() => {
                        const [hour, minute] = editingAppointment.time.split(":")
                        const startMinutes = parseInt(hour) * 60 + parseInt(minute)
                        const endMinutes = startMinutes + parseInt(value)
                        const endHour = Math.floor(endMinutes / 60)
                        const endMinute = endMinutes % 60
                        return `${endHour}:${endMinute === 0 ? "00" : endMinute}`
                      })()
                    })
                  }
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingAppointment.status}
                  onValueChange={(value) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      status: value as "available" | "booked",
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingAppointment.status === "booked" && (
                <div className="space-y-2">
                  <Label htmlFor="with">Meeting With</Label>
                  <Input
                    id="with"
                    value={editingAppointment.with || ""}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        with: e.target.value,
                      })
                    }
                    placeholder="Enter name or organization"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-between">
            {editingAppointment && getAppointmentForSlot(editingAppointment.time, editingAppointment.date) && (
              <Button variant="destructive" onClick={handleDeleteAppointment} className="mr-auto hover:bg-destructive/90">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingAppointment(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAppointment} className="bg-primary hover:bg-primary/90">
                <FileText className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

