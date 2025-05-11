"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Company } from "@/lib/companies/types";
import { updateMyCompany } from "@/lib/companies/api";

// Схема валидации для формы компании
const companyFormSchema = z.object({
  name: z.string().min(1, "Название компании обязательно").max(255, "Название не может быть длиннее 255 символов"),
  inn: z.string().regex(/^(\d{10}|\d{12})$/, "ИНН должен содержать 10 или 12 цифр").optional().or(z.literal("")),
  description: z.string().optional(),
  address: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company: Company;
  onUpdate?: (updatedCompany: Company) => void;
}

export default function CompanyForm({ company, onUpdate }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company.name || "",
      inn: company.inn || "",
      description: company.description || "",
      address: company.address || "",
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    
    try {
      const updatedCompany = await updateMyCompany(data);
      
      toast({
        title: "Компания обновлена",
        description: "Данные компании успешно обновлены",
      });
      
      if (onUpdate) {
        onUpdate(updatedCompany);
      }
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось обновить данные компании",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные компании</CardTitle>
        <CardDescription>
          Обновите информацию о вашей компании
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название компании *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="ООО Моя Компания"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inn">ИНН</Label>
            <Input
              id="inn"
              {...register("inn")}
              placeholder="1234567890"
            />
            {errors.inn && (
              <p className="text-sm text-red-500">{errors.inn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Краткое описание деятельности компании"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 