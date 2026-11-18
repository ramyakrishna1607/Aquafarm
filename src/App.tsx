/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthScreen } from './components/views/AuthScreen';
import { CalculatorsView } from './components/views/CalculatorsView';
import { DashboardView } from './components/views/DashboardView';
import { EmployeesView } from './components/views/EmployeesView';
import { FeedingView } from './components/views/FeedingView';
import { FinanceView } from './components/views/FinanceView';
import { HarvestView } from './components/views/HarvestView';
import { HealthView } from './components/views/HealthView';
import { MasterKeysView } from './components/views/MasterKeysView';
import { PondsView } from './components/views/PondsView';
import { ReportsView } from './components/views/ReportsView';
import { StockView } from './components/views/StockView';
import { WaterQualityView } from './components/views/WaterQualityView';
import { FarmProvider, useFarm } from './context/FarmContext';
import { AppRoute } from './types/aquafarm';

const AquaFarmWorkspace: React.FC = () => {
  const { currentUser } = useFarm();
  const [activeRoute, setActiveRoute] = useState<AppRoute>('dashboard');

  if (!currentUser) {
    return <AuthScreen />;
  }

  const renderPage = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveRoute} />;
      case 'ponds':
        return <PondsView />;
      case 'stock':
        return <StockView />;
      case 'feeding':
        return <FeedingView />;
      case 'water':
        return <WaterQualityView />;
      case 'health':
        return <HealthView />;
      case 'harvest':
        return <HarvestView />;
      case 'finance':
        return <FinanceView />;
      case 'employees':
        return <EmployeesView />;
      case 'reports':
        return <ReportsView />;
      case 'calculators':
        return <CalculatorsView />;
      case 'keys':
        return <MasterKeysView />;
      default:
        return <DashboardView onNavigate={setActiveRoute} />;
    }
  };

  return (
    <AppShell activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {renderPage()}
    </AppShell>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <AquaFarmWorkspace />
    </FarmProvider>
  );
}
