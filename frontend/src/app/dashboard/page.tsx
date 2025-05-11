"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Добро пожаловать, {user?.firstName}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Карточка статистики запросов */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-semibold mb-2 text-blue-700">Запросы</h2>
          <div className="text-4xl font-bold text-blue-800">0</div>
          <p className="text-sm text-blue-600 mt-2">Активных запросов</p>
        </div>

        {/* Карточка подрядчиков */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h2 className="text-xl font-semibold mb-2 text-green-700">Подрядчики</h2>
          <div className="text-4xl font-bold text-green-800">0</div>
          <p className="text-sm text-green-600 mt-2">Доступных подрядчиков</p>
        </div>

        {/* Карточка шаблонов */}
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h2 className="text-xl font-semibold mb-2 text-purple-700">Шаблоны</h2>
          <div className="text-4xl font-bold text-purple-800">0</div>
          <p className="text-sm text-purple-600 mt-2">Доступных шаблонов</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Последние действия</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            Пока нет действий для отображения
          </div>
        </div>
      </div>
    </div>
  );
} 