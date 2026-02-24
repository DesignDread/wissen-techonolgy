'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils } from '@/utils/auth';

/**
 * HOC to protect routes that require authentication
 */
export function withProtectedRoute(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();

    useEffect(() => {
      // Check if user is authenticated
      if (!authUtils.isAuthenticated()) {
        // Redirect to login
        router.push('/login');
      }
    }, [router]);

    // Show loading while checking auth
    if (!authUtils.isAuthenticated()) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      );
    }

    // Render component if authenticated
    return <Component {...props} />;
  };
}

/**
 * HOC to protect admin-only routes
 */
export function withAdminRoute(Component) {
  return function AdminComponent(props) {
    const router = useRouter();

    useEffect(() => {
      // Check if user is authenticated and admin
      if (!authUtils.isAuthenticated()) {
        router.push('/login');
      } else if (!authUtils.isAdmin()) {
        router.push('/dashboard');
      }
    }, [router]);

    // Show loading while checking auth
    if (!authUtils.isAuthenticated() || !authUtils.isAdmin()) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking permissions...</p>
          </div>
        </div>
      );
    }

    // Render component if admin
    return <Component {...props} />;
  };
}

/**
 * Hook to use in components for auth checks
 */
export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return {
    user: authUtils.getUser(),
    isAuthenticated: authUtils.isAuthenticated(),
    isAdmin: authUtils.isAdmin(),
    logout: () => {
      authUtils.logout();
      router.push('/login');
    },
  };
}

/**
 * Hook for admin-only access
 */
export function useAdminRoute() {
  const router = useRouter();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push('/login');
    } else if (!authUtils.isAdmin()) {
      router.push('/dashboard');
    }
  }, [router]);

  return {
    user: authUtils.getUser(),
    isAdmin: authUtils.isAdmin(),
  };
}
