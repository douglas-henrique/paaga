import { z } from "zod";
import { NextResponse } from "next/server";
import { sanitizeName } from "./sanitize";

// Email validation
export const emailSchema = z.string().email("Email inválido").toLowerCase().trim();

// Password validation (minimum 8 characters, at least one letter and one number)
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(100, "A senha deve ter no máximo 100 caracteres")
  .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

// Name validation with sanitization
export const nameSchema = z
  .string()
  .min(2, "O nome deve ter pelo menos 2 caracteres")
  .max(100, "O nome deve ter no máximo 100 caracteres")
  .transform((val) => {
    const sanitized = sanitizeName(val);
    return sanitized || val.trim();
  })
  .refine((val) => val.length >= 2 && val.length <= 100, {
    message: "O nome deve ter entre 2 e 100 caracteres após sanitização",
  })
  .optional();

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

// Challenge creation schema
export const createChallengeSchema = z.object({
  start_date: z.string().refine(
    (date) => !isNaN(new Date(date).getTime()),
    "Data inválida"
  ),
  user_id: z.string().min(1, "user_id é obrigatório"),
});

// Deposit creation schema
export const createDepositSchema = z.object({
  challenge_id: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  day_number: z.number().int().min(1).max(200),
  deposited_at: z.string().optional().transform((val) => 
    val ? new Date(val) : new Date()
  ),
});

// Challenge update schema
export const updateChallengeSchema = z.object({
  start_date: z.string().refine(
    (date) => !isNaN(new Date(date).getTime()),
    "Data inválida"
  ),
});

// Helper to return validation error
export function validationErrorResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

// Helper to return server error
export function serverErrorResponse(message = "Internal server error") {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

