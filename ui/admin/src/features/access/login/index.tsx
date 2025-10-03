import { useNavigate } from "react-router";
import { useState } from "react";

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/api/authentication";

const schema = z.object({
    email: z.email("Digite um e-mail válido"),
    password: z.string(),
    remember: z.boolean()
})

// 2. Tipagem com base no schema
type FormValues = z.infer<typeof schema>

export const LoginLayout = () => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "", remember: false },
        mode: "onTouched",
    })

    const { control } = form;

    const onSubmit = async (values: FormValues) => {
        try {
            await signIn(values);
            navigate("/company", { replace: true });
        } catch (err: any) {
            setErrorMessage("Falha ao autenticar usuário na plataforma.");
        }
    };

    return (
        <div className="min-h-svh w-full bg-muted/30 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="leading-none font-semibold">Login no backoffice</CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">Digite seu e-mail abaixo para acessar sua conta</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
                                <div className="grid gap-2">
                                    <FormField
                                        control={control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="voce@ahocultural.com"
                                                        autoComplete="email"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <FormField
                                        control={control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Senha</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        autoComplete="current-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FormField
                                        control={control}
                                        name="remember"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="remember"
                                                    checked={field.value}
                                                    onCheckedChange={(checked) =>
                                                        field.onChange(Boolean(checked))
                                                    }
                                                />
                                                <FormLabel htmlFor="remember" className="text-sm font-normal">
                                                    Manter conectado
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/* Bloco de erro opcional (visual) */}
                                {errorMessage ? (
                                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                        {errorMessage}
                                    </div>
                                ) : null}
                                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full cursor-pointer">
                                    {form.formState.isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="sr-only">Enviando</span>
                                        </>
                                    ) : (
                                        "Entrar"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>


                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            * Este acesso é exclusivo para administradores do sistema.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
