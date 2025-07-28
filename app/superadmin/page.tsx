"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { LogOut, User, UserPlus, Edit, Trash2, Shield, ListPlus, Building } from "lucide-react" // Added ListPlus, Building
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminView from "@/components/admin-view"

interface AdminUser {
  id: string
  username: string
  role: string
  canManageAuditorium?: boolean
  canManageConferenceHall?: boolean
  canEditPrincipalSchedule?: boolean
  canManageDynamicEntities?: boolean
}

interface DynamicEntity {
  id: string;
  name: string;
  entityTypeLabel: string;
  managerId?: string | null;
  manager?: { username: string }; // For display
  // createdAt?: string; // Optional: if you plan to display it
  // updatedAt?: string; // Optional: if you plan to display it
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoaded, setIsLoaded] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "admin",
  })

  // State for Dynamic Entities
  const [dynamicEntities, setDynamicEntities] = useState<DynamicEntity[]>([])
  const [isLoadingDynamicEntities, setIsLoadingDynamicEntities] = useState(true)
  const [isDynamicEntityDialogOpen, setIsDynamicEntityDialogOpen] = useState(false)
  const [editingDynamicEntity, setEditingDynamicEntity] = useState<DynamicEntity | null>(null)
  const [newDynamicEntity, setNewDynamicEntity] = useState<{name: string; entityTypeLabel: string; managerId: string | null;}>({ // Ensure managerId can be null
    name: "",
    entityTypeLabel: "",
    managerId: null, // Default to null for "No Manager"
  })
  const [entityToDeleteId, setEntityToDeleteId] = useState<string | null>(null); // For delete confirmation

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session.user.role !== "superadmin") {
        router.push("/")
      } else {
        setIsLoaded(true)
        fetchUsers()
        fetchDynamicEntities() // Fetch dynamic entities on load
      }
    }
  }, [status, router, session])

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

  // CRUD functions for Dynamic Entities
  const fetchDynamicEntities = async () => {
    setIsLoadingDynamicEntities(true);
    try {
      const response = await fetch("/api/dynamic-entities");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch if response is not JSON
        throw new Error(errorData.error || "Failed to fetch dynamic entities");
      }
      const data = await response.json();
      setDynamicEntities(data);
    } catch (error) {
      console.error("Error fetching dynamic entities:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to load dynamic entities.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDynamicEntities(false);
    }
  };

  const handleAddDynamicEntity = async () => {
    if (!newDynamicEntity.name || !newDynamicEntity.entityTypeLabel) {
      toast({ title: "Validation Error", description: "Name and Type Label are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dynamic-entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDynamicEntity.name,
          entityTypeLabel: newDynamicEntity.entityTypeLabel,
          managerId: newDynamicEntity.managerId || null, // Ensure null is sent if empty
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create dynamic entity");
      }
      await fetchDynamicEntities(); // Refresh list
      toast({ title: "Success", description: "Dynamic entity created successfully." });
      setIsDynamicEntityDialogOpen(false);
      setNewDynamicEntity({ name: "", entityTypeLabel: "", managerId: null });
    } catch (error) {
      console.error("Error creating dynamic entity:", error);
      toast({ title: "Error", description: (error as Error).message || "Failed to create dynamic entity.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDynamicEntity = async () => {
    if (!editingDynamicEntity || !newDynamicEntity.name || !newDynamicEntity.entityTypeLabel) {
       toast({ title: "Validation Error", description: "Name and Type Label are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dynamic-entities/${editingDynamicEntity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDynamicEntity.name, // Use newDynamicEntity as form state
          entityTypeLabel: newDynamicEntity.entityTypeLabel,
          managerId: newDynamicEntity.managerId || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update dynamic entity");
      }
      await fetchDynamicEntities(); // Refresh list
      toast({ title: "Success", description: "Dynamic entity updated successfully." });
      setIsDynamicEntityDialogOpen(false);
      setEditingDynamicEntity(null);
    } catch (error) {
      console.error("Error updating dynamic entity:", error);
      toast({ title: "Error", description: (error as Error).message || "Failed to update dynamic entity.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const confirmDeleteDynamicEntity = async () => {
    if (!entityToDeleteId) return;
    setIsSubmitting(true); // Use general isSubmitting or a specific one for delete
    try {
      const response = await fetch(`/api/dynamic-entities/${entityToDeleteId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) { // 204 is a success for DELETE
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete dynamic entity");
      }
      await fetchDynamicEntities(); // Refresh list
      toast({ title: "Success", description: "Dynamic entity deleted successfully." });
    } catch (error) {
      console.error("Error deleting dynamic entity:", error);
      toast({ title: "Error", description: (error as Error).message || "Failed to delete dynamic entity.", variant: "destructive" });
    } finally {
      setEntityToDeleteId(null); // Close confirmation dialog
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      const createdUser = await response.json()

      // Reset form
      setNewUser({
        username: "",
        password: "",
        role: "admin",
      })

      setIsDialogOpen(false)

      // Refresh users list
      fetchUsers()

      toast({
        title: "Success",
        description: "Admin user created successfully",
      })
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editingUser.username,
          role: editingUser.role,
          canManageAuditorium: editingUser.canManageAuditorium,
          canManageConferenceHall: editingUser.canManageConferenceHall,
          canEditPrincipalSchedule: editingUser.canEditPrincipalSchedule,
          canManageDynamicEntities: editingUser.canManageDynamicEntities,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      // Refresh users list
      fetchUsers()

      setEditingUser(null)

      toast({
        title: "Success",
        description: "Admin user updated successfully",
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      // Refresh users list
      fetchUsers()

      toast({
        title: "Success",
        description: "Admin user deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleResetPassword = async (id: string) => {
    const password = prompt("Enter new password")
    if (!password) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reset password")
      }

      toast({
        title: "Success",
        description: "Password reset successfully",
      })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  if (status === "loading" || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071&auto=format&fit=crop"
          alt="SPIT Campus"
          fill
          className="object-cover opacity-5"
          priority
        />
      </div>

      <header className="relative z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="https://www.spit.ac.in/wp-content/uploads/2021/01/LogoSPIT.png"
              alt="SPIT Logo"
              width={50}
              height={50}
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Principal's Schedule - Super Admin Panel</h1>
              <p className="text-xs text-gray-500">Sardar Patel Institute of Technology, Mumbai</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>
                Logged in as: <span className="font-medium">Super Admin</span>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <Tabs defaultValue="userManagement" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6"> {/* Updated to grid-cols-3 */}
            <TabsTrigger value="userManagement">User Management</TabsTrigger>
            <TabsTrigger value="scheduleManagement">Schedule Management</TabsTrigger>
            <TabsTrigger value="dynamicEntityManagement">Dynamic Entities</TabsTrigger> {/* New Trigger */}
          </TabsList>

          <TabsContent value="userManagement">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Admin User Management
                </h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Admin User</DialogTitle>
                      <DialogDescription>Create a new admin user who can manage the principal's schedule</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          placeholder="Username"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Password"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddUser} disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[400px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {users.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No admin users found</p>
                        ) : (
                          users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-gray-500" />
                                  <span className="font-medium">{user.username}</span>
                                </div>
                                <span className="text-sm text-gray-500">Role: {user.role}</span>
                              </div>
                              {user.role !== "superadmin" && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResetPassword(user.id)}
                                    className="text-xs"
                                  >
                                    Reset Password
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setEditingUser(user)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduleManagement">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Management</CardTitle>
                <CardDescription>View and manage all schedules across different rooms. Approve pending entries as superadmin.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminView /> {/* AdminView will use its own session checking for role-specific UI */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dynamicEntityManagement">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  Dynamic Entity Management
                </h2>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setEditingDynamicEntity(null); // Clear any editing state
                    setNewDynamicEntity({ name: "", entityTypeLabel: "", managerId: "" }); // Reset form
                    setIsDynamicEntityDialogOpen(true);
                  }}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add Dynamic Entity
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Registered Dynamic Entities</CardTitle>
                  <CardDescription>Manage custom entities like special rooms, VIPs, or resources.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDynamicEntities ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {dynamicEntities.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No dynamic entities found. Add one to get started.</p>
                      ) : (
                        <div className="space-y-4">
                          {dynamicEntities.map((entity) => (
                            <div
                              key={entity.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Building className="h-5 w-5 text-gray-500" />
                                  <span className="font-medium">{entity.name}</span>
                                  <Badge variant="outline">{entity.entityTypeLabel}</Badge>
                                </div>
                                <span className="text-sm text-gray-500 ml-7">
                                  Managed by: {entity.manager?.username || "N/A"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingDynamicEntity(entity);
                                    setEditingDynamicEntity(entity); // Set the entity being edited
                                    // Pre-fill form state (newDynamicEntity) with the selected entity's data
                                    setNewDynamicEntity({ 
                                      name: entity.name,
                                      entityTypeLabel: entity.entityTypeLabel,
                                      managerId: entity.managerId || null, 
                                    });
                                    setIsDynamicEntityDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => setEntityToDeleteId(entity.id)} // Open delete confirmation
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Admin User</DialogTitle>
              <DialogDescription>Update admin user details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-canManageAuditorium"
                      checked={editingUser.canManageAuditorium || false}
                      onCheckedChange={(checked) =>
                        setEditingUser({ ...editingUser, canManageAuditorium: !!checked })
                      }
                      disabled={editingUser.role === 'superadmin' || session?.user?.id === editingUser.id}
                    />
                    <Label htmlFor="edit-canManageAuditorium" className="font-normal">Can Manage Auditorium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-canManageConferenceHall"
                      checked={editingUser.canManageConferenceHall || false}
                      onCheckedChange={(checked) =>
                        setEditingUser({ ...editingUser, canManageConferenceHall: !!checked })
                      }
                      disabled={editingUser.role === 'superadmin' || session?.user?.id === editingUser.id}
                    />
                    <Label htmlFor="edit-canManageConferenceHall" className="font-normal">Can Manage Conference Hall</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-canEditPrincipalSchedule"
                      checked={editingUser.canEditPrincipalSchedule || false}
                      onCheckedChange={(checked) =>
                        setEditingUser({ ...editingUser, canEditPrincipalSchedule: !!checked })
                      }
                      disabled={editingUser.role === 'superadmin' || session?.user?.id === editingUser.id}
                    />
                    <Label htmlFor="edit-canEditPrincipalSchedule" className="font-normal">Can Edit Principal's Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-canManageDynamicEntities"
                      checked={editingUser.canManageDynamicEntities || false}
                      onCheckedChange={(checked) =>
                        setEditingUser({ ...editingUser, canManageDynamicEntities: !!checked })
                      }
                      disabled={editingUser.role === 'superadmin' || session?.user?.id === editingUser.id}
                    />
                    <Label htmlFor="edit-canManageDynamicEntities" className="font-normal">Can Manage Dynamic Entities</Label>
                  </div>
                   {editingUser.role === 'superadmin' && (
                    <p className="text-xs text-muted-foreground pt-2">
                      Superadmin permissions cannot be modified.
                    </p>
                  )}
                   {session?.user?.id === editingUser.id && editingUser.role !== 'superadmin' && (
                     <p className="text-xs text-muted-foreground pt-2">
                      You cannot modify your own permissions here.
                    </p>
                   )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Dynamic Entity Dialog */}
      <Dialog open={isDynamicEntityDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingDynamicEntity(null);
          setNewDynamicEntity({ name: "", entityTypeLabel: "", managerId: null }); // Reset with null
        }
        setIsDynamicEntityDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDynamicEntity ? "Edit Dynamic Entity" : "Add Dynamic Entity"}</DialogTitle>
            <DialogDescription>
              {editingDynamicEntity ? "Update the details of this dynamic entity." : "Create a new dynamic entity to be scheduled."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="de-name">Name *</Label>
              <Input
                id="de-name"
                value={newDynamicEntity.name} // Form bound to newDynamicEntity
                onChange={(e) => setNewDynamicEntity({ ...newDynamicEntity, name: e.target.value })}
                placeholder="e.g., VIP Guest Room Alpha, Project Phoenix"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="de-typeLabel">Type Label *</Label>
              <Input
                id="de-typeLabel"
                value={newDynamicEntity.entityTypeLabel} // Form bound to newDynamicEntity
                onChange={(e) => setNewDynamicEntity({ ...newDynamicEntity, entityTypeLabel: e.target.value })}
                placeholder="e.g., VIP Room, Focus Group, Resource"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="de-manager">Manager (Optional)</Label>
              <Select
                value={newDynamicEntity.managerId || ""} // Handle null for Select value
                onValueChange={(value) =>
                  setNewDynamicEntity({ ...newDynamicEntity, managerId: value === "none" ? null : value })
                }
              >
                <SelectTrigger id="de-manager">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {users.filter(u => u.role !== 'superadmin').map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDynamicEntityDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={editingDynamicEntity ? handleUpdateDynamicEntity : handleAddDynamicEntity} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (editingDynamicEntity ? "Updating..." : "Adding...") : (editingDynamicEntity ? "Save Changes" : "Add Entity")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dynamic Entity Confirmation Dialog */}
      <AlertDialog open={!!entityToDeleteId} onOpenChange={(open) => !open && setEntityToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dynamic entity? This action cannot be undone. 
              Associated schedule entries will have their dynamic entity link removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntityToDeleteId(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDynamicEntity} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <footer className="bg-gray-800 text-white mt-10 relative z-10">
        <div className="container mx-auto px-4 py-4 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Sardar Patel Institute of Technology. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
