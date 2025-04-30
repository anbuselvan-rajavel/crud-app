// app/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Eye, Pencil, Trash, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const formSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  status: z.enum(['active', 'inactive']),
})

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar: string
  status: 'active' | 'inactive'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'create' | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      status: 'active',
    },
  })

  useEffect(() => {
    form.reset(selectedUser || {
      first_name: '',
      last_name: '',
      email: '',
      status: 'active',
    })
  }, [selectedUser, form])

  const fetchUsers = async (page: number) => {
    try {
      setIsLoading(true)
      const res = await fetch(`https://reqres.in/api/users?page=${page}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_REQRES_API_KEY!
        }
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const { data } = await res.json()
      const usersWithStatus = data.map((user: Omit<User, 'status'>) => ({
        ...user,
        status: Math.random() > 0.5 ? 'active' : 'inactive'
      } as User))
      setUsers(usersWithStatus)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: number) => {
    try {
      await fetch(`https://reqres.in/api/users/${id}`, { 
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_REQRES_API_KEY!
        }
      })
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (dialogType === 'edit' && selectedUser) {
        const res = await fetch(`https://reqres.in/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_REQRES_API_KEY!
          },
          body: JSON.stringify(values)
        })
        const data = await res.json()
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...data } : u))
      } else if (dialogType === 'create') {
        const res = await fetch('https://reqres.in/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_REQRES_API_KEY!
          },
          body: JSON.stringify(values)
        })
        const data = await res.json()
        const newUser = {
          ...data,
          id: Date.now(),
          avatar: `https://reqres.in/img/faces/${Math.floor(Math.random() * 12) + 1}-image.jpg`,
          status: 'active'
        } as User
        setUsers(prev => [newUser, ...prev])
      }
      setDialogType(null)
      setSelectedUser(null)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => {
          setDialogType('create')
          setSelectedUser(null)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {searchTerm && (
            <X
              className="absolute right-3 top-3 h-4 w-4 cursor-pointer"
              onClick={() => setSearchTerm('')}
            />
          )}
        </div>
        
        <Select 
  value={statusFilter} 
  onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Statuses</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="inactive">Inactive</SelectItem>
  </SelectContent>
</Select>
      </div>

      {/* User Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No users found</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Image
                      src={user.avatar}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </TableCell>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user)
                        setDialogType('view')
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user)
                        setDialogType('edit')
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and other existing components remain the same */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm">Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= 2}
        >
          Next
        </Button>
      </div>
      
      {/* Dialog for viewing/editing users */}
      <Dialog open={!!dialogType} onOpenChange={(open) => !open && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'create' ? 'Create User' 
               : dialogType === 'edit' ? 'Edit User' 
               : 'User Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'view' ? (
            <div className="space-y-4">
              <Image
                src={selectedUser?.avatar || ''}
                alt={`${selectedUser?.first_name} ${selectedUser?.last_name}`}
                width={80}
                height={80}
                className="rounded-full mx-auto"
              />
              <div className="space-y-2">
                <Label>Name</Label>
                <p>{selectedUser?.first_name} {selectedUser?.last_name}</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p>{selectedUser?.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <p>{selectedUser?.status}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...form.register('first_name')} />
                {form.formState.errors.first_name && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...form.register('last_name')} />
                {form.formState.errors.last_name && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {dialogType === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}