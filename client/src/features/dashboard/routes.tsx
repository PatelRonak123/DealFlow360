import { RouteObject } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <DashboardLayout />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
];