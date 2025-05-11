"use client";

import { FC } from "react";
import Link from "next/link";

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-lg font-semibold text-gray-900">
              Платформа для предпринимателей
            </Link>
          </div>
          
          <div className="text-sm text-gray-600">
            &copy; {currentYear} Все права защищены
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Условия использования
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 