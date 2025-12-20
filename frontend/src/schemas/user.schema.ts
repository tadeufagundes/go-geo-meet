/**
 * User & Common Schemas - Validação com Zod
 * 
 * Schemas para validar dados de usuários e tipos comuns.
 */

import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

/**
 * Roles de usuário
 */
export const UserRoleSchema = z.enum(['student', 'teacher', 'admin']);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Schema de usuário
 */
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email('Email inválido'),
  displayName: z.string().min(1, 'Nome é obrigatório').max(100),
  role: UserRoleSchema,
  photoURL: z.string().url().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Schema para participante em reunião
 */
export const ParticipantSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).max(100),
  isLocal: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

// ============================================
// Error Schemas
// ============================================

/**
 * Schema para resposta de erro da API
 */
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  userMessage: z.string(),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================
// Common Validation Helpers
// ============================================

/**
 * Valida se é um email válido
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Valida se é uma URL válida
 */
export function isValidUrl(url: string): boolean {
  return z.string().url().safeParse(url).success;
}

/**
 * Valida se é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  return z.string().uuid().safeParse(uuid).success;
}

/**
 * Sanitiza string para uso seguro (remove caracteres especiais)
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}
