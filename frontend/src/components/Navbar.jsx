'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authUtils } from '@/utils/auth';
import { authAPI } from '@/services/api';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(authUtils.getUser());
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authUtils.logout();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600">
              📅
            </div>
            Seat Booking
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-blue-200 transition">
                  Dashboard
                </Link>
                <Link href="/my-bookings" className="hover:text-blue-200 transition">
                  My Bookings
                </Link>
                <Link href="/book-spare" className="hover:text-blue-200 transition">
                  Book Seat
                </Link>

                {authUtils.isAdmin() && (
                  <Link href="/admin" className="hover:text-blue-200 transition font-semibold">
                    👨‍💼 Admin
                  </Link>
                )}

                <div className="border-l border-blue-400 pl-6">
                  <span className="text-sm">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="ml-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition disabled:opacity-50"
                  >
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-blue-200 transition">
                  Login
                </Link>
                <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-blue-500 rounded"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-blue-400">
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:bg-blue-500 px-2 rounded">
                  Dashboard
                </Link>
                <Link href="/my-bookings" className="block py-2 hover:bg-blue-500 px-2 rounded">
                  My Bookings
                </Link>
                <Link href="/book-spare" className="block py-2 hover:bg-blue-500 px-2 rounded">
                  Book Seat
                </Link>
                {authUtils.isAdmin() && (
                  <Link href="/admin" className="block py-2 hover:bg-blue-500 px-2 rounded font-semibold">
                    👨‍💼 Admin
                  </Link>
                )}
                <div className="py-2 px-2 border-t border-blue-400 mt-2">
                  <p className="text-sm mb-2">{user.name}</p>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition disabled:opacity-50"
                  >
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 hover:bg-blue-500 px-2 rounded">
                  Login
                </Link>
                <Link href="/register" className="block py-2 hover:bg-blue-500 px-2 rounded">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
