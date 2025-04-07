"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  X,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppointments } from "@/hooks/use-appointments"
import { formatTime, formatDateToYYYYMMDD, getWeekDates } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { addDays, format, isSameDay, isWithinInterval, parseISO } from "date-fns"
import Loading from "@/components/loading"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function PublicCalendar() {
  const [date, setDate] = useState<Date>(new Date())
  const { appointments, loading, refreshAppointments } = useAppointments()
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [isCompact, setIsCompact] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  })
  const [timeRange, setTimeRange] = useState({
    start: "08:00",
    end: "22:00"
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Generate time slots based on selected time range
  const timeSlots = (() => {
    const [startHour] = timeRange.start.split(":").map(Number)
    const [endHour] = timeRange.end.split(":").map(Number)
    const slots = []
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of ["00", "30"]) {
        const nextHour = minute === "30" ? hour : hour + 1
        const nextMinute = minute === "30" ? "00" : "30"
        
        slots.push({
          start: `${hour.toString().padStart(2, "0")}:${minute}`,
          end: `${nextHour.toString().padStart(2, "0")}:${nextMinute}`,
          displayTime: formatTime(`${hour}:${minute}`),
        })
      }
    }
    return slots
  })()
  
  // Filter appointments based on search query, date range, time range, and status
  const filteredAppointments = appointments.filter((appointment) => {
    // Filter by search query
    const matchesSearch = searchQuery
      ? appointment.with?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.date.includes(searchQuery) ||
        appointment.time.includes(searchQuery)
      : true

    // Filter by date range
    const appointmentDate = new Date(appointment.date)
    const matchesDateRange = dateRange?.from && dateRange?.to
      ? isWithinInterval(appointmentDate, { start: dateRange.from, end: dateRange.to })
      : true

    // Filter by time range
    const [appointmentHour, appointmentMinute] = appointment.time.split(':').map(Number)
    const appointmentTimeValue = appointmentHour * 60 + appointmentMinute
    
    const [startHour, startMinute] = timeRange.start.split(':').map(Number)
    const startTimeValue = startHour * 60 + startMinute
    
    const [endHour, endMinute] = timeRange.end.split(':').map(Number)
    const endTimeValue = endHour * 60 + endMinute
    
    const matchesTimeRange = appointmentTimeValue >= startTimeValue && appointmentTimeValue <= endTimeValue

    // Filter by status
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'booked' 
        ? appointment.status === 'booked' 
        : statusFilter === 'available' 
          ? appointment.status === 'available'
          : statusFilter === 'upcoming'
            ? new Date(appointment.date) >= new Date(new Date().setHours(0, 0, 0, 0))
            : statusFilter === 'past'
              ? new Date(appointment.date) < new Date(new Date().setHours(0, 0, 0, 0))
              : true

    return matchesSearch && matchesDateRange && matchesTimeRange && matchesStatus
  })

  const getWeekDates = (currentDate: Date) => {
    const week = []
    const first = currentDate.getDate() - currentDate.getDay()
    for (let i = 0; i < 7; i++) {
      const day = new Date(new Date(currentDate).setDate(first + i))
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(date)

  const getAppointmentForSlot = (slot: string, dateStr: string) => {
    return appointments.find((apt) => apt.date === dateStr && apt.time === slot)
  }

  const isDateInRange = (dateStr: string) => {
    if (!dateRange?.from) return true
    const date = new Date(dateStr)
    if (dateRange.to) {
      return date >= dateRange.from && date <= dateRange.to
    }
    return date.getTime() === dateRange.from.getTime()
  }

  const renderTimeSlotCell = (slot: any, dateStr: string) => {
    const appointment = getAppointmentForSlot(slot.start, dateStr)
    const isBooked = appointment?.status === 'booked'
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    const isInRange = isDateInRange(dateStr)

    if (!isInRange) {
      return <td className="border bg-muted/30" />
    }

    return (
      <td
        key={`${dateStr}-${slot.start}`}
        className={cn(
          "border p-2 relative transition-all duration-200",
          isToday && "bg-muted/30",
          isBooked ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent",
          "cursor-pointer group"
        )}
        onClick={() => setSelectedSlot({ ...slot, date: dateStr, with: appointment?.with })}
      >
        <div className="flex flex-col gap-1">
          {isBooked && (
            <>
              <Badge 
                variant="outline" 
                className="w-fit bg-primary/10 border-primary/20 text-primary"
              >
                Booked
              </Badge>
              {appointment.with && (
                <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {appointment.with}
                </p>
              )}
            </>
          )}
        </div>
      </td>
    )
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: `${i.toString().padStart(2, "0")}:00`,
    label: formatTime(`${i}:00`),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date)
              if (viewMode === "month") {
                newDate.setMonth(newDate.getMonth() - 1)
              } else {
                newDate.setDate(newDate.getDate() - (viewMode === "week" ? 7 : 1))
              }
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
              if (viewMode === "month") {
                newDate.setMonth(newDate.getMonth() + 1)
              } else {
                newDate.setDate(newDate.getDate() + (viewMode === "week" ? 7 : 1))
              }
              setDate(newDate)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setDate(new Date())
              refreshAppointments()
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Get Latest Schedule
          </Button>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "day" | "week" | "month")}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center">
            <Label htmlFor="compact-mode-public" className="flex cursor-pointer items-center gap-2">
              <Checkbox
                id="compact-mode-public"
                checked={isCompact}
                onCheckedChange={(checked) => setIsCompact(checked as boolean)}
              />
              Compact
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appointments..."
              className="w-full pl-8 sm:w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(dateRange || timeRange.start !== "08:00" || timeRange.end !== "22:00" || statusFilter !== "all") && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Calendar</SheetTitle>
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        </div>
      </div>

      {viewMode === "month" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium p-2 text-sm">
                  {day}
                </div>
              ))}
              
              {(() => {
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const startDate = new Date(monthStart);
                startDate.setDate(startDate.getDate() - startDate.getDay());
                
                const days = [];
                const currentDate = new Date();
                
                for (let i = 0; i < 42; i++) {
                  const day = new Date(startDate);
                  day.setDate(startDate.getDate() + i);
                  const dateStr = formatDateToYYYYMMDD(day);
                  const isCurrentMonth = day.getMonth() === date.getMonth();
                  const isToday = day.toDateString() === currentDate.toDateString();
                  
                  // Get appointments for this day
                  const dayAppointments = filteredAppointments.filter(apt => apt.date === dateStr);
                  const hasBookedAppointments = dayAppointments.some(apt => apt.status === "booked");
                  
                  days.push(
                    <div 
                      key={i} 
                      className={cn(
                        "min-h-[80px] p-1 border relative",
                        !isCurrentMonth && "text-muted-foreground bg-muted/20",
                        isToday && "bg-primary/5 border-primary",
                        "hover:bg-accent/50 cursor-pointer transition-colors"
                      )}
                      onClick={() => {
                        setDate(day);
                        setViewMode("day");
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
                        <div className="space-y-1 mt-1 max-h-[60px] overflow-hidden">
                          {dayAppointments.slice(0, 2).map((apt, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "text-xs px-1 py-0.5 rounded truncate",
                                apt.status === "booked" ? "bg-primary/10 text-primary" : "bg-muted"
                              )}
                            >
                              {formatTime(apt.time)}: {apt.with ? apt.with.substring(0, 12) + (apt.with.length > 12 ? "..." : "") : "Available"}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border bg-muted p-2 text-left sticky left-0 z-20 bg-background">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </th>
                    {(viewMode === "week" ? weekDates : [date]).map((weekDate) => (
                      <th 
                        key={weekDate.toISOString()} 
                        className={cn(
                          "border bg-muted p-2 text-center min-w-[150px]",
                          weekDate.toDateString() === new Date().toDateString() && "bg-primary/10"
                        )}
                      >
                        <div className="font-medium">
                          {weekDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-sm font-normal text-muted-foreground">
                          {weekDate.toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric" 
                          })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={slot.start}>
                      <td className="border p-2 text-sm text-muted-foreground sticky left-0 z-10 bg-background font-medium">
                        {slot.displayTime}
                      </td>
                      {(viewMode === "week" ? weekDates : [date]).map((weekDate) =>
                        renderTimeSlotCell(slot, formatDateToYYYYMMDD(weekDate))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {new Date(selectedSlot.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                  <p className="text-muted-foreground">{selectedSlot.displayTime}</p>
                </div>
              </div>
              {selectedSlot.with && (
                <div className="flex items-start gap-3 text-sm">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Meeting With</p>
                    <p className="text-muted-foreground">{selectedSlot.with}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

