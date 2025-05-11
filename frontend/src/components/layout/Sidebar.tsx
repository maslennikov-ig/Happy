"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  HomeIcon, 
  MessageSquareIcon, 
  SettingsIcon, 
  UserIcon, 
  UsersIcon,
  FileTextIcon,
  CreditCardIcon,
  MenuIcon,
  XIcon
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: FC<NavItemProps> = ({ href, icon, label, isActive }) => {
  return (
    <Link href={href} className="w-full">
      <Button
        variant="ghost"
        className={`w-full justify-start ${
          isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span className="mr-2">{icon}</span>
        {label}
      </Button>
    </Link>
  );
};

const Sidebar: FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { href: "/dashboard", icon: <HomeIcon size={20} />, label: "Дашборд" },
    { href: "/dashboard/requests", icon: <MessageSquareIcon size={20} />, label: "Запросы" },
    { href: "/dashboard/contractors", icon: <UsersIcon size={20} />, label: "Подрядчики" },
    { href: "/dashboard/templates", icon: <FileTextIcon size={20} />, label: "Шаблоны" },
    { href: "/dashboard/tariffs", icon: <CreditCardIcon size={20} />, label: "Тарифы" },
    { href: "/dashboard/company", icon: <SettingsIcon size={20} />, label: "Настройки компании" },
    { href: "/dashboard/profile", icon: <UserIcon size={20} />, label: "Профиль" },
  ];

  return (
    <>
      {/* Мобильная версия - кнопка меню */}
      <div className="lg:hidden fixed top-4 right-4 z-20">
        <Button variant="outline" size="icon" onClick={toggleSidebar}>
          {isOpen ? <XIcon /> : <MenuIcon />}
        </Button>
      </div>

      {/* Overlay для мобильной версии */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Сайдбар */}
      <aside 
        className={`
          fixed lg:sticky top-0 h-screen bg-white w-64 border-r transition-transform lg:translate-x-0 z-20
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-4">
          <div className="py-4 border-b mb-4">
            <h2 className="text-xl font-bold">Меню</h2>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 