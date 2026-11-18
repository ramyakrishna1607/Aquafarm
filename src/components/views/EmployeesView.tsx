import React, { useState } from 'react';
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { AttendanceRecord, Employee } from '../../types/aquafarm';
import { formatCurrency, formatDateShort } from '../../utils/calculations';
import { ModuleLogo } from '../ui/BrandLogos';
import { Modal, StatTile, StatusLabel } from '../ui/CommonUI';

type StaffTab = 'directory' | 'attendance' | 'tasks' | 'payroll';

export const EmployeesView: React.FC = () => {
  const {
    state,
    canManageStaff,
    canAccessFinance,
    canDelete,
    addEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    recordAttendance,
    addEmployeeTask,
    toggleEmployeeTask,
    deleteEmployeeTask,
  } = useFarm();

  const [tab, setTab] = useState<StaffTab>('directory');
  const [empModal, setEmpModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const [empForm, setEmpForm] = useState<Omit<Employee, 'id'>>({
    name: '',
    role: 'Pond Technician',
    department: 'Pond Operations',
    phone: '',
    email: '',
    monthlySalary: 20000,
    status: 'On Duty',
    assignedPonds: [],
    joinDate: today,
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    employeeId: state.employees[0]?.id ?? 'emp-1',
    pondId: '',
    dueDate: today,
    priority: 'Normal' as 'Normal' | 'High',
    completed: false,
  });

  const onDutyCount = state.employees.filter((e) => e.status === 'On Duty').length;
  const totalPayroll = state.employees.reduce((acc, e) => acc + e.monthlySalary, 0);
  const openTasks = state.employeeTasks.filter((t) => !t.completed).length;

  const openAddEmployee = () => {
    setEditingEmpId(null);
    setEmpForm({
      name: '',
      role: 'Pond Technician',
      department: 'Pond Operations',
      phone: '',
      email: '',
      monthlySalary: 20000,
      status: 'On Duty',
      assignedPonds: [],
      joinDate: today,
    });
    setEmpModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmpId(emp.id);
    const { id: _id, ...rest } = emp;
    setEmpForm(rest);
    setEmpModal(true);
  };

  const togglePondAssignment = (pondId: string) => {
    setEmpForm((prev) => ({
      ...prev,
      assignedPonds: prev.assignedPonds.includes(pondId)
        ? prev.assignedPonds.filter((id) => id !== pondId)
        : [...prev.assignedPonds, pondId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <ModuleLogo kind="employees" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employees, Roles & Salary Management (₹)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Digitally update employee details, roles, assigned ponds, attendance, daily tasks, and monthly salaries in Indian Rupees.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTaskModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
          {canManageStaff && (
            <button
              type="button"
              onClick={openAddEmployee}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Staff" value={`${state.employees.length}`} detail="Registered farm personnel" accent="sky" />
        <StatTile label="On Duty Today" value={`${onDutyCount}`} detail="Active across pond & lab shifts" accent="teal" />
        <StatTile label="Open Tasks" value={`${openTasks}`} detail={`${state.employeeTasks.length} total assigned tasks`} accent={openTasks > 0 ? 'amber' : 'teal'} />
        <StatTile
          label="Monthly Payroll (₹)"
          value={canAccessFinance ? formatCurrency(totalPayroll) : 'Restricted'}
          detail={canAccessFinance ? 'Combined base monthly salaries' : 'Manager / Admin access only'}
          accent="sky"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ['directory', 'Staff Directory'],
            ['attendance', 'Attendance'],
            ['tasks', 'Daily Tasks'],
            ...(canAccessFinance ? [['payroll', 'Salary Records (₹)']] : []),
          ] as [StaffTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Assigned Ponds</th>
                  <th className="py-3 px-4">Contact</th>
                  {canAccessFinance && <th className="py-3 px-4 text-right">Salary / mo (₹)</th>}
                  <th className="py-3 px-4">Status</th>
                  {canManageStaff && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.employees.map((emp) => {
                  const pondCodes = emp.assignedPonds
                    .map((pid) => state.ponds.find((p) => p.id === pid)?.code)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          Joined {formatDateShort(emp.joinDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{emp.role}</div>
                        <div className="text-[11px] text-slate-500">{emp.department}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {pondCodes || 'All / Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{emp.phone}</div>
                        <div className="text-[11px] text-slate-400">{emp.email}</div>
                      </td>
                      {canAccessFinance && (
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-sky-800">
                          {formatCurrency(emp.monthlySalary)}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <StatusLabel level={emp.status} />
                      </td>
                      {canManageStaff && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditEmployee(emp)}
                              title="Edit employee details & salary"
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <select
                              value={emp.status}
                              onChange={(e) =>
                                updateEmployeeStatus(emp.id, e.target.value as Employee['status'])
                              }
                              className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded"
                            >
                              <option value="On Duty">On Duty</option>
                              <option value="Off Duty">Off Duty</option>
                              <option value="On Leave">On Leave</option>
                            </select>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteEmployee(emp.id)}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 text-xs font-semibold text-slate-900">
            Today&apos;s Attendance Sheet ({formatDateShort(today)})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4 text-right">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.employees.map((emp) => {
                  const rec =
                    state.attendanceRecords.find(
                      (a) => a.employeeId === emp.id && a.date === today
                    ) ??
                    state.attendanceRecords.find((a) => a.employeeId === emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                      <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {rec?.checkInTime ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusLabel level={rec?.status ?? 'Absent'} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {(['Present', 'Half Day', 'Absent'] as AttendanceRecord['status'][]).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => recordAttendance(emp.id, st)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                  rec?.status === st
                                    ? 'bg-sky-700 text-white border-sky-700'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {state.employeeTasks.map((task) => {
            const emp = state.employees.find((e) => e.id === task.employeeId);
            const pond = state.ponds.find((p) => p.id === task.pondId);
            return (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleEmployeeTask(task.id)}
                    className="mt-0.5 text-teal-700 shrink-0"
                    aria-label="Toggle task completion"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 hover:text-sky-700" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>Assigned to {emp?.name ?? 'Staff'}</span>
                      {pond && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{pond.code}</span>
                        </>
                      )}
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">Due {formatDateShort(task.dueDate)}</span>
                      <span aria-hidden="true"> · </span>
                      <span
                        className={
                          task.priority === 'High'
                            ? 'text-amber-700 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {task.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteEmployeeTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'payroll' && canAccessFinance && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Monthly Salary (₹)</th>
                  <th className="py-3 px-4 text-right">Annualized (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 text-slate-700">{emp.role}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(emp.monthlySalary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(emp.monthlySalary * 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 text-xs font-semibold">
                  <td className="py-3 px-4" colSpan={3}>
                    Total Monthly Labour Commitment
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-sky-800">
                    {formatCurrency(totalPayroll)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrency(totalPayroll * 12)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        open={empModal}
        onClose={() => setEmpModal(false)}
        title={editingEmpId ? 'Update Employee Details & Salary' : 'Add Staff Member'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!empForm.name.trim()) return;
            if (editingEmpId) {
              updateEmployee(editingEmpId, empForm);
            } else {
              addEmployee(empForm);
            }
            setEmpModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Role / Position</label>
              <input
                type="text"
                required
                value={empForm.role}
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <select
                value={empForm.department}
                onChange={(e) =>
                  setEmpForm({
                    ...empForm,
                    department: e.target.value as Employee['department'],
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Pond Operations">Pond Operations</option>
                <option value="Water & Health Lab">Water & Health Lab</option>
                <option value="Feeding & Logistics">Feeding & Logistics</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Monthly Salary (₹ INR)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={empForm.monthlySalary}
                onChange={(e) =>
                  setEmpForm({ ...empForm, monthlySalary: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                placeholder="+91 98400 00000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={empForm.email}
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Assigned Ponds</label>
            <div className="flex flex-wrap gap-1.5">
              {state.ponds.map((p) => {
                const selected = empForm.assignedPonds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePondAssignment(p.id)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                      selected
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.code}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEmpModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-sky-700 rounded-lg">
              {editingEmpId ? 'Save Updates' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title="Assign Daily Task"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!taskForm.title.trim()) return;
            addEmployeeTask({
              ...taskForm,
              pondId: taskForm.pondId || undefined,
            });
            setTaskForm({ ...taskForm, title: '' });
            setTaskModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Description</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Flush biofloc sludge drain valve"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assign To</label>
              <select
                value={taskForm.employeeId}
                onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {state.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pond (Optional)</label>
              <select
                value={taskForm.pondId}
                onChange={(e) => setTaskForm({ ...taskForm, pondId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">General Farm Task</option>
                {state.ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value as 'Normal' | 'High' })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTaskModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-teal-700 rounded-lg">
              Assign Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
