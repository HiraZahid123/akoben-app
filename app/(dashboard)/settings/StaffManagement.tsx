'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import Badge from '@/components/ui/Badge'
import { ROLE_LABELS, MANAGER_CREATABLE_ROLES, roleHasOverridePrivilege, type UserRole } from '@/lib/permissions'

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  can_override_payment?: boolean
  created_at: string
}

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[]

export default function StaffManagement({ currentUserRole }: { currentUserRole: UserRole }) {
  const { success, error: toastError } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', staffRole: 'staff1' as UserRole, canOverridePayment: false })

  // Manager cannot create/assign the Bookkeeper/Accountant role
  const assignableRoles = currentUserRole === 'manager'
    ? ALL_ROLES.filter(r => MANAGER_CREATABLE_ROLES.includes(r))
    : ALL_ROLES

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    setLoading(true)
    const res = await fetch('/api/staff')
    if (res.ok) setStaff(await res.json())
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toastError(data.error); return }
    success(`${form.full_name} added successfully`)
    setForm({ full_name: '', email: '', password: '', staffRole: 'staff1', canOverridePayment: false })
    setAdding(false)
    loadStaff()
  }

  async function toggleActive(member: StaffMember) {
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
    })
    success(member.is_active ? `${member.full_name} deactivated` : `${member.full_name} activated`)
    loadStaff()
  }

  async function changeRole(member: StaffMember, newRole: string) {
    if (currentUserRole === 'manager' && newRole === 'bookkeeper') {
      toastError('Managers cannot assign the Bookkeeper/Accountant role')
      return
    }
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, staffRole: newRole }),
    })
    success('Role updated')
    loadStaff()
  }

  async function toggleOverride(member: StaffMember) {
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, canOverridePayment: !member.can_override_payment }),
    })
    success(member.can_override_payment ? 'Override permission removed' : 'Override permission granted')
    loadStaff()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Staff Accounts</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Roles follow the Staff Permissions Matrix (Admin, Manager, Staff 1/2, Bookkeeper, Set-Up/Breakdown Crew, Driver).
            {currentUserRole === 'manager' && ' You cannot create or assign the Bookkeeper/Accountant role.'}
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Add Staff
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="p-5 bg-blue-50 border-b border-blue-100 space-y-3">
          <p className="text-sm font-medium text-gray-800 mb-1">New Staff Account</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. Ama Mensah" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="staff@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
              <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
              <select value={form.staffRole} onChange={e => setForm(f => ({ ...f, staffRole: e.target.value as UserRole }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {assignableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <input type="checkbox" checked={form.canOverridePayment}
              onChange={e => setForm(f => ({ ...f, canOverridePayment: e.target.checked }))} />
            <span>Grant <strong>50% Override</strong> permission — allows booking events or releasing pull orders with an unmet balance. Every use sends an email alert to Irene.</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </form>
      )}

      {/* Staff list */}
      {loading ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">Loading...</p>
      ) : staff.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">No staff accounts yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-5 py-3 font-medium text-gray-600">Name</th>
              <th className="px-5 py-3 font-medium text-gray-600">Email</th>
              <th className="px-5 py-3 font-medium text-gray-600">Role</th>
              <th className="px-5 py-3 font-medium text-gray-600">50% Override</th>
              <th className="px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map(member => {
              const memberRole = member.role as UserRole
              const roleAlwaysOverrides = roleHasOverridePrivilege(memberRole)
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{member.full_name}</td>
                  <td className="px-5 py-3 text-gray-500">{member.email}</td>
                  <td className="px-5 py-3">
                    <select value={member.role}
                      onChange={e => changeRole(member, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {ALL_ROLES.map(r => (
                        <option key={r} value={r} disabled={currentUserRole === 'manager' && r === 'bookkeeper'}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    {roleAlwaysOverrides ? (
                      <span className="text-xs text-gray-400">Always allowed</span>
                    ) : (
                      <button onClick={() => toggleOverride(member)}
                        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          member.can_override_payment ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {member.can_override_payment ? '✓ Granted' : 'Grant'}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={member.is_active ? 'success' : 'default'} className="text-xs">
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(member)}
                      className={`text-xs font-medium ${member.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
