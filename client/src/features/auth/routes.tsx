import { RouteObject } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/register',
    element: <Signup />,
  },
];
