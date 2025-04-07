import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return format(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a')
}

export function getWeekDates(currentDate: Date) {
  const dates = []
  // Get the first day of the week (Sunday)
  const first = currentDate.getDate() - currentDate.getDay()

  // Generate array of dates for the week
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDate.setDate(first + i))
    dates.push(new Date(day))
  }

  // Reset the current date
  currentDate.setDate(first)

  return dates
}

export function formatDateToYYYYMMDD(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isValidDate(dateString: string): boolean {
  const date = parseISO(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

