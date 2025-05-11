"use client";

import { useState, useEffect } from "react";
import { getMyCompany, getEmployees } from "@/lib/companies/api";
import { Company, Employee } from "@/lib/companies/types";
import { useToast } from "@/components/ui/use-toast";
import CompanyForm from "@/components/company/CompanyForm";
import EmployeesList from "@/components/company/EmployeesList";
import InviteEmployeeForm from "@/components/company/InviteEmployeeForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Загружаем данные компании при монтировании компонента
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoading(true);
        const companyData = await getMyCompany();
        setCompany(companyData);
        
        const employeesData = await getEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Ошибка при загрузке данных компании:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Не удалось загрузить данные компании",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [toast]);

  const handleCompanyUpdate = (updatedCompany: Company) => {
    setCompany(updatedCompany);
    toast({
      title: "Успешно",
      description: "Данные компании обновлены",
    });
  };

  const handleEmployeeInvited = () => {
    // Перезагружаем список сотрудников после приглашения
    setIsInviteDialogOpen(false);
    getEmployees()
      .then((data) => {
        setEmployees(data);
        toast({
          title: "Успешно",
          description: "Приглашение отправлено",
        });
      })
      .catch((error) => {
        console.error("Ошибка при загрузке списка сотрудников:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Не удалось обновить список сотрудников",
          variant: "destructive",
        });
      });
  };

  const handleEmployeeRemoved = () => {
    // Перезагружаем список сотрудников после удаления
    getEmployees()
      .then((data) => {
        setEmployees(data);
        toast({
          title: "Успешно",
          description: "Сотрудник удален",
        });
      })
      .catch((error) => {
        console.error("Ошибка при загрузке списка сотрудников:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Не удалось обновить список сотрудников",
          variant: "destructive",
        });
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Управление компанией</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Данные компании</h2>
          {company && <CompanyForm company={company} onUpdate={handleCompanyUpdate} />}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Сотрудники</h2>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Пригласить</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <InviteEmployeeForm onInvited={handleEmployeeInvited} />
              </DialogContent>
            </Dialog>
          </div>
          
          <EmployeesList 
            employees={employees} 
            onEmployeeRemoved={handleEmployeeRemoved} 
          />
        </div>
      </div>
    </div>
  );
} 