/**
 * Session Schemas - Validação com Zod
 * 
 * Schemas para validar dados de sessões de aula.
 */

import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const SessionStatusSchema = z.enum(['scheduled', 'live', 'completed', 'cancelled']);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

// ============================================
// Session Schemas
// ============================================

/**
 * Schema para criar uma nova sessão
 */
export const CreateSessionInputSchema = z.object({
  turmaId: z
    .string()
    .min(1, 'ID da turma é obrigatório')
    .max(100, 'ID da turma muito longo'),
  turmaName: z
    .string()
    .min(1, 'Nome da turma é obrigatório')
    .max(200, 'Nome da turma muito longo'),
  scheduledAt: z.string().datetime().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

/**
 * Schema para sessão completa (do Firestore)
 */
export const SessionSchema = z.object({
  id: z.string().min(1),
  turmaId: z.string().min(1),
  turmaName: z.string().min(1),
  teacherId: z.string().min(1),
  teacherName: z.string().min(1),
  jitsiRoomName: z.string().min(1),
  jitsiRoomPassword: z.string().optional(),
  status: SessionStatusSchema,
  scheduledAt: z.string().datetime().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Schema para DTO de sessão (retornado pela API)
 */
export const SessionDTOSchema = z.object({
  id: z.string().min(1),
  turmaId: z.string().min(1),
  turmaName: z.string().min(1),
  teacherId: z.string().min(1),
  teacherName: z.string().min(1),
  jitsiRoomName: z.string().min(1),
  status: SessionStatusSchema,
  scheduledAt: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export type SessionDTO = z.infer<typeof SessionDTOSchema>;

/**
 * Schema para resposta de criação de sessão
 */
export const CreateSessionResponseSchema = z.object({
  id: z.string().min(1),
  jitsiRoomName: z.string().min(1),
  jitsiRoomPassword: z.string().min(1),
  joinUrl: z.string().url().optional(),
  status: SessionStatusSchema,
});

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Valida input de criação de sessão
 */
export function validateCreateSessionInput(input: unknown): CreateSessionInput {
  return CreateSessionInputSchema.parse(input);
}

/**
 * Valida sessão com safe parse (não lança erro)
 */
export function safeValidateSession(data: unknown): { success: boolean; data?: Session; error?: z.ZodError } {
  const result = SessionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
