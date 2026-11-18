import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  DollarSign,
  Droplets,
  Fish,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  RotateCcw,
  Users,
  Utensils,
  Waves,
  X,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { AppRoute, UserRole } from '../../types/aquafarm';
import { AquaFarmLogo } from '../ui/BrandLogos';
import { NotificationsDrawer } from './NotificationsDrawer';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ReactNode;
  group: 'Operations' | 'Production' | 'Business';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Operations' },
  { id: 'ponds', label: 'Ponds', icon: <Waves className="w-4 h-4" />, group: 'Operations' },
  { id: 'stock', label: 'Fish Stock', icon: <Fish className="w-4 h-4" />, group: 'Operations' },
  { id: 'feeding', label: 'Feeding', icon: <Utensils className="w-4 h-4" />, group: 'Production' },
  { id: 'water', label: 'Water Quality', icon: <Droplets className="w-4 h-4" />, group: 'Production' },
  { id: 'health', label: 'Virus & Health', icon: <HeartPulse className="w-4 h-4" />, group: 'Production' },
  { id: 'harvest', label: 'Harvests', icon: <PackageCheck className="w-4 h-4" />, group: 'Production' },
  { id: 'finance', label: 'Financials', icon: <DollarSign className="w-4 h-4" />, group: 'Business' },
  { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" />, group: 'Business' },
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, group: 'Business' },
  { id: 'calculators', label: 'Smart Calculators', icon: <Calculator className="w-4 h-4" />, group: 'Business' },
];

export const AppShell: React.FC<{
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
}> = ({ activeRoute, onNavigate, children }) => {
  const { currentUser, logout, switchRole, alerts, resetDemoData } = useFarm();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const activeItem = NAV_ITEMS.find((i) => i.id === activeRoute) ?? NAV_ITEMS[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Mark */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            onNavigate('dashboard');
            setMobileNavOpen(false);
          }}
          className="text-left"
        >
          <AquaFarmLogo size="md" theme="dark" showSubtitle />
        </button>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {(['Operations', 'Production', 'Business'] as const).map((group) => (
          <div key={group}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400">
              {group}
            </div>
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const active = activeRoute === item.id;
                const isRestricted =
                  currentUser?.role === 'Employee' && item.id === 'finance';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-sky-50 text-sky-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={active ? 'text-sky-700' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isRestricted && (
                      <span className="text-[10px] text-slate-400">Restricted</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Switcher & User Account Footer */}
      <div className="p-3 border-t border-slate-200 space-y-3 bg-slate-50/70">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1 px-1">
            Active Role View
          </label>
          <select
            value={currentUser?.role ?? 'Admin'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-sky-700"
          >
            <option value="Admin">Admin (Full Access)</option>
            <option value="Farm Manager">Farm Manager</option>
            <option value="Employee">Employee (Field Ops)</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentUser?.avatarUrl && !avatarErr ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarErr(true)}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {(currentUser?.name ?? 'AF')
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {currentUser?.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentUser?.role}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={logout}
            className="flex-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:border-sky-600 hover:text-sky-800 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <LogOut className="w-3 h-3" />
            <span>Login / Register</span>
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            title="Reset sample data"
            aria-label="Reset sample data"
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:text-slate-900 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-900/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileNavOpen(false);
          }}
        >
          <div className="w-64 h-full">{renderSidebarContent()}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
              <span className="font-medium text-slate-700 whitespace-nowrap">AquaFarm</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900 truncate">{activeItem.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-sky-700" />
              <span>Reminders</span>
              {alerts.length > 0 && (
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    criticalCount > 0 ? 'text-red-700' : 'text-sky-700'
                  }`}
                >
                  ({alerts.length})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('water')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Log Water Test</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
