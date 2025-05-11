"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Employee } from "@/lib/companies/types";
import { removeEmployee } from "@/lib/companies/api";
import { Loader2 } from "lucide-react";

interface EmployeesListProps {
  employees: Employee[];
  onEmployeeRemoved: () => void;
}

export default function EmployeesList({ employees, onEmployeeRemoved }: EmployeesListProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const { toast } = useToast();

  // Функция для удаления сотрудника
  const handleRemoveEmployee = async (employeeId: string) => {
    if (confirm("Вы уверены, что хотите удалить этого сотрудника?")) {
      setIsRemoving(employeeId);
      try {
        await removeEmployee(employeeId);
        toast({
          title: "Успешно",
          description: "Сотрудник успешно удален",
        });
        onEmployeeRemoved();
      } catch (error) {
        console.error("Ошибка при удалении сотрудника:", error);
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при удалении сотрудника",
          variant: "destructive",
        });
      } finally {
        setIsRemoving(null);
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {employees.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>У вас пока нет сотрудников</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Имя</th>
                  <th className="py-2 px-4 text-left">Фамилия</th>
                  <th className="py-2 px-4 text-left">Статус</th>
                  <th className="py-2 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{employee.email}</td>
                    <td className="py-2 px-4">{employee.firstName || "-"}</td>
                    <td className="py-2 px-4">{employee.lastName || "-"}</td>
                    <td className="py-2 px-4">
                      {employee.isActive ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Активен
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveEmployee(employee.id)}
                        disabled={isRemoving === employee.id}
                      >
                        {isRemoving === employee.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Удаление...
                          </>
                        ) : (
                          "Удалить"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 