import { z } from "zod"

export const emailSchema = z.string().email("Email inválido").max(255)

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")

export const nameSchema = z
  .string()
  .min(2, "Nome muito curto")
  .max(100, "Nome muito longo")
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras")

export const messageSchema = z
  .string()
  .min(1, "Mensagem não pode ser vazia")
  .max(2000, "Mensagem muito longa")

export const weightSchema = z.number().min(20, "Peso inválido").max(300, "Peso inválido")
export const heightSchema = z.number().min(100, "Altura inválida").max(250, "Altura inválida")
export const ageSchema = z.number().min(14, "Idade mínima é 14 anos").max(120, "Idade inválida")

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 5000)
}

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  }
}
