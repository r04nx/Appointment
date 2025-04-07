"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

// Define the appointment type
export type Appointment = {
  id: string
  date: string
  time: string
  endTime?: string
  status: "available" | "booked"
  with?: string
  duration?: number
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        // If the API fails, use fallback data for demo purposes
        if (response.status === 503 || response.status === 500) {
          console.warn('Using fallback appointment data due to API error')
          const today = new Date().toISOString().split('T')[0]
          const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
          
          const fallbackData = [
            {
              id: "1",
              date: today,
              time: "9:00",
              endTime: "9:30",
              status: "booked" as const,
              with: "Department Heads Meeting",
              duration: 30
            },
            {
              id: "2",
              date: today,
              time: "14:00",
              endTime: "14:30",
              status: "booked" as const,
              with: "Student Council",
              duration: 30
            },
            {
              id: "3",
              date: today,
              time: "14:30",
              endTime: "15:00",
              status: "booked" as const,
              with: "Faculty Meeting",
              duration: 30
            },
            {
              id: "4",
              date: tomorrow,
              time: "10:00",
              endTime: "10:30",
              status: "booked" as const,
              with: "Faculty Interview",
              duration: 30
            },
            {
              id: "5",
              date: tomorrow,
              time: "10:30",
              endTime: "11:00",
              status: "booked" as const,
              with: "Student Counseling",
              duration: 30
            }
          ]
          setAppointments(fallbackData)
          setLoading(false)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to load appointments. Using demo data instead.",
        variant: "destructive",
      })
      
      // Fallback to demo data if API fails
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
      
      const fallbackData = [
        {
          id: "1",
          date: today,
          time: "9:00",
          endTime: "9:30",
          status: "booked" as const,
          with: "Department Heads Meeting",
          duration: 30
        },
        {
          id: "2",
          date: today,
          time: "14:00",
          endTime: "14:30",
          status: "booked" as const,
          with: "Student Council",
          duration: 30
        },
        {
          id: "3",
          date: today,
          time: "14:30",
          endTime: "15:00",
          status: "booked" as const,
          with: "Faculty Meeting",
          duration: 30
        }
      ]
      setAppointments(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...appointment }),
      })

      if (!response.ok) {
        // For demo purposes, update local state even if API fails
        if (response.status === 503 || response.status === 500) {
          console.warn('API error, updating local state only')
          const updatedAppointment = { 
            ...appointments.find(app => app.id === id), 
            ...appointment,
            id 
          } as Appointment
          
          setAppointments(prev => 
            prev.map(app => app.id === id ? updatedAppointment : app)
          )
          
          toast({
            title: "Success",
            description: "Appointment updated successfully (local only)",
          })
          
          return updatedAppointment
        }
        throw new Error('Failed to update appointment')
      }

      const updatedAppointment = await response.json()
      setAppointments(prev => 
        prev.map(app => app.id === id ? updatedAppointment : app)
      )

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      })

      return updatedAppointment
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: "Warning",
        description: "API error: Changes saved locally only",
        variant: "destructive",
      })
      
      // Update local state even if API fails
      const updatedAppointment = { 
        ...appointments.find(app => app.id === id), 
        ...appointment,
        id 
      } as Appointment
      
      setAppointments(prev => 
        prev.map(app => app.id === id ? updatedAppointment : app)
      )
      
      return updatedAppointment
    }
  }

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(appointment),
      })
      
      if (!response.ok) {
        // For demo purposes, add to local state even if API fails
        if (response.status === 503 || response.status === 500) {
          console.warn('API error, adding to local state only')
          const newAppointment = {
            ...appointment,
            id: Date.now().toString()
          } as Appointment
          
          setAppointments(prev => [...prev, newAppointment])
          
          toast({
            title: "Success",
            description: "Appointment added successfully (local only)",
          })
          
          return newAppointment
        }
        throw new Error('Failed to add appointment')
      }
      
      const newAppointment = await response.json()
      setAppointments(prev => [...prev, newAppointment])
      
      toast({
        title: "Success",
        description: "Appointment added successfully",
      })
      
      return newAppointment
    } catch (error) {
      console.error('Error adding appointment:', error)
      toast({
        title: "Warning",
        description: "API error: Appointment saved locally only",
        variant: "destructive",
      })
      
      // Add to local state even if API fails
      const newAppointment = {
        ...appointment,
        id: Date.now().toString()
      } as Appointment
      
      setAppointments(prev => [...prev, newAppointment])
      return newAppointment
    }
  }

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        // For demo purposes, remove from local state even if API fails
        if (response.status === 503 || response.status === 500) {
          console.warn('API error, removing from local state only')
          setAppointments(prev => prev.filter(apt => apt.id !== id))
          
          toast({
            title: "Success",
            description: "Appointment deleted successfully (local only)",
          })
          
          return
        }
        throw new Error('Failed to delete appointment')
      }
      
      setAppointments(prev => prev.filter(apt => apt.id !== id))
      
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast({
        title: "Warning",
        description: "API error: Appointment removed locally only",
        variant: "destructive",
      })
      
      // Remove from local state even if API fails
      setAppointments(prev => prev.filter(apt => apt.id !== id))
    }
  }

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshAppointments: fetchAppointments,
  }
}

