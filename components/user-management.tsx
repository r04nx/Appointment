"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, User, UserPlus, Edit, Trash2, Shield, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AdminUser {
  id: string
  username: string
  role: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showResetPasswordAlert, setShowResetPasswordAlert] = useState(false)
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "admin" // Keep role in state for API consistency
  })

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Create a new user
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          role: "admin" // Always set role to admin
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === "Username already exists") {
          toast({
            title: "Username Already Exists",
            description: `The username "${newUser.username}" is already taken. Please choose a different username.`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })
      
      // Reset form and refresh user list
      setNewUser({
        username: "",
        password: "",
        role: "admin",
      })
      setIsSubmitting(false)
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  // Update an existing user
  const handleUpdateUser = async () => {
    if (!editingUser || !editingUser.username) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editingUser.username,
          // Keep the existing role, don't allow changes
          role: editingUser.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      
      setShowDeleteAlert(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Reset user password
  const handleResetPassword = async () => {
    if (!userToResetPassword || !newPassword) {
      toast({
        title: "Error",
        description: "User and new password are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${userToResetPassword.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reset password")
      }

      toast({
        title: "Success",
        description: "Password reset successfully",
      })
      
      setShowResetPasswordAlert(false)
      setUserToResetPassword(null)
      setNewPassword("")
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-md">
              <UserPlus className="h-4 w-4" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
              <DialogDescription>
                Add a new admin user to the system. They will be able to manage the schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              {/* Role is fixed as admin */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  <span className="capitalize">Admin</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No users found</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-4 px-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        {user.role === "superadmin" ? (
                          <Shield className="h-5 w-5 text-blue-700" />
                        ) : (
                          <User className="h-5 w-5 text-blue-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">
                          Role: <span className="capitalize">{user.role === "superadmin" ? "Superadmin" : "Admin"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.role !== "superadmin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToResetPassword(user)
                            setShowResetPasswordAlert(true)
                          }}
                          className="h-8 w-8 rounded-full"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingUser(user)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.role !== "superadmin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToDelete(user)
                            setShowDeleteAlert(true)
                          }}
                          className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details. Note that passwords can only be reset, not viewed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              {/* Role is no longer editable */}
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  <span className="capitalize">{editingUser.role}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdateUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user &quot;{userToDelete?.username}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Alert */}
      <AlertDialog open={showResetPasswordAlert} onOpenChange={setShowResetPasswordAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for user &quot;{userToResetPassword?.username}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setUserToResetPassword(null)
              setNewPassword("")
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPassword}
              disabled={!newPassword || isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
