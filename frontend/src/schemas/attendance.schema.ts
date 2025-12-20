/**
 * Attendance Schemas - Validação com Zod
 * 
 * Schemas para validar dados de presença em aulas.
 */

import { z } from 'zod';

// ============================================
// Attendance Schemas
// ============================================

/**
 * Schema para registrar presença (entrada)
 */
export const RegisterAttendanceInputSchema = z.object({
  sessionId: z
    .string()
    .min(1, 'ID da sessão é obrigatório'),
  participantId: z
    .string()
    .min(1, 'ID do participante é obrigatório'),
  participantName: z
    .string()
    .min(1, 'Nome do participante é obrigatório')
    .max(100, 'Nome muito longo'),
  role: z.enum(['teacher', 'student']).default('student'),
});

export type RegisterAttendanceInput = z.infer<typeof RegisterAttendanceInputSchema>;

/**
 * Schema para registro de presença completo
 */
export const AttendanceLogSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  participantName: z.string().min(1),
  role: z.enum(['teacher', 'student']),
  joinedAt: z.string().datetime(),
  leftAt: z.string().datetime().optional(),
});

export type AttendanceLog = z.infer<typeof AttendanceLogSchema>;

/**
 * Schema para resposta de registro de presença
 */
export const AttendanceResponseSchema = z.object({
  success: z.boolean(),
  attendanceId: z.string().min(1),
  jitsiRoomName: z.string().optional(),
});

export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Valida input de registro de presença
 */
export function validateRegisterAttendance(input: unknown): RegisterAttendanceInput {
  return RegisterAttendanceInputSchema.parse(input);
}

/**
 * Valida registro de presença com safe parse
 */
export function safeValidateAttendance(data: unknown): { success: boolean; data?: AttendanceLog; error?: z.ZodError } {
  const result = AttendanceLogSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
