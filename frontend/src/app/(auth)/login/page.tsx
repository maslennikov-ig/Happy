"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/context/AuthContext";

// Схема валидации для формы входа
const loginSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
  password: z.string().min(1, {
    message: "Пароль обязателен",
  }),
});

// Тип данных формы на основе схемы
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем наличие параметра reset=success в URL
  useEffect(() => {
    const reset = searchParams.get('reset');
    if (reset === 'success') {
      toast({
        title: "Пароль сброшен",
        description: "Ваш пароль был успешно изменен",
        variant: "default",
      });
    }
  }, [searchParams, toast]);

  // Инициализация формы
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      
      toast({
        title: "Вход выполнен",
        description: "Добро пожаловать в систему!",
        variant: "default",
      });

      // Перенаправление на дашборд
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Ошибка входа",
        description: err instanceof Error ? err.message : "Неверный email или пароль",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
        <CardDescription>
          Введите ваши учетные данные для входа
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите ваш пароль" 
                      type="password" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Забыли пароль?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-gray-600">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Зарегистрироваться
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 