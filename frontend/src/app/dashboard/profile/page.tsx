"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  changePassword,
} from "@/lib/auth/api";

// Схема валидации для формы профиля
const profileSchema = z.object({
  firstName: z.string().min(2, {
    message: "Имя должно содержать не менее 2 символов",
  }),
  lastName: z.string().min(2, {
    message: "Фамилия должна содержать не менее 2 символов",
  }),
});

// Схема валидации для формы смены пароля
const passwordSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Текущий пароль обязателен",
  }),
  newPassword: z.string().min(8, {
    message: "Новый пароль должен содержать не менее 8 символов",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Типы данных форм на основе схем
type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Создаю функцию для обновления профиля, которая будет использовать хук useAuth
const updateProfileData = async (data: ProfileFormValues, updateProfile: (data: {firstName?: string, lastName?: string}) => Promise<{success: boolean, error?: string}>) => {
  try {
    const response = await updateProfile(data);
    return response;
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
    throw error;
  }
};

// Функция компонента страницы профиля
export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Инициализация формы профиля
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  // Инициализация формы смены пароля
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Обработчик отправки формы профиля
  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsLoadingProfile(true);

    try {
      await updateProfileData(data, updateProfile);

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Произошла ошибка при обновлении профиля',
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Обработчик отправки формы смены пароля
  const onSubmitPassword = async (data: PasswordFormValues) => {
    setIsLoadingPassword(true);

    try {
      const response = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно обновлен",
        variant: "default",
      });
      passwordForm.reset();
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Произошла ошибка при смене пароля',
        variant: "destructive",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Профиль пользователя</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Форма профиля */}
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
            <CardDescription>
              Обновите ваши персональные данные
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите ваше имя" 
                          {...field}
                          disabled={isLoadingProfile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите вашу фамилию" 
                          {...field}
                          disabled={isLoadingProfile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoadingProfile}>
                  {isLoadingProfile ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Форма смены пароля */}
        <Card>
          <CardHeader>
            <CardTitle>Смена пароля</CardTitle>
            <CardDescription>
              Обновите ваш пароль для входа в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текущий пароль</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите текущий пароль" 
                          type="password" 
                          {...field}
                          disabled={isLoadingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый пароль</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите новый пароль" 
                          type="password" 
                          {...field}
                          disabled={isLoadingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Подтверждение пароля</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Подтвердите новый пароль" 
                          type="password" 
                          {...field}
                          disabled={isLoadingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoadingPassword}>
                  {isLoadingPassword ? "Изменение..." : "Изменить пароль"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 