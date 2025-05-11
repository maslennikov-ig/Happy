"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/auth/api";

// Схема валидации для формы восстановления пароля
const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
});

// Тип данных формы на основе схемы
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация формы
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Запрос отправлен",
        description: "Инструкции по восстановлению пароля отправлены на указанный email",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось отправить запрос на восстановление пароля",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Восстановление пароля</CardTitle>
        <CardDescription>
          Введите ваш email для получения инструкций по восстановлению пароля
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="example@company.com" 
                      type="email" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Отправка..." : "Отправить инструкции"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-600">
          Вспомнили пароль?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Вернуться ко входу
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ForgotPasswordPage; 