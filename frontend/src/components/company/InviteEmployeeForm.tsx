"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { InviteEmployeeDto } from "@/lib/companies/types";
import { inviteEmployee } from "@/lib/companies/api";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Схема валидации для формы приглашения
const inviteFormSchema = z.object({
  email: z.string().email("Введите корректный email"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  position: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteEmployeeFormProps {
  onInvited: () => void;
}

export default function InviteEmployeeForm({ onInvited }: InviteEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      position: "",
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true);

    try {
      // Подготовка данных для отправки
      const inviteData: InviteEmployeeDto = {
        email: data.email,
      };
      
      if (data.firstName) inviteData.firstName = data.firstName;
      if (data.lastName) inviteData.lastName = data.lastName;
      if (data.position) inviteData.position = data.position;

      await inviteEmployee(inviteData);
      
      toast({
        title: "Успешно",
        description: "Приглашение отправлено",
      });
      
      reset(); // Сбрасываем форму
      onInvited();
    } catch (error) {
      console.error("Ошибка при отправке приглашения:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при отправке приглашения",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Пригласить сотрудника</DialogTitle>
        <DialogDescription>
          Заполните форму, чтобы отправить приглашение новому сотруднику
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="employee@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Имя</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Иван"
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Фамилия</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Иванов"
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Должность</Label>
          <Input
            id="position"
            {...register("position")}
            placeholder="Менеджер"
          />
          {errors.position && (
            <p className="text-sm text-red-500">{errors.position.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить приглашение"
            )}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
} 