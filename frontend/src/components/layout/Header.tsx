"use client";

import { FC } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Header: FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Ошибка при выходе из системы:", error);
    }
  };

  return (
    <header className="bg-white border-b py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Платформа для предпринимателей
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="ghost" onClick={handleLogout}>
                  Выйти
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Войти
                </Link>
                <Link href="/register">
                  <Button variant="outline">Регистрация</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 