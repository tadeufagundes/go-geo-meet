/**
 * Feedback Schemas - Validação com Zod
 * 
 * Schemas para validar dados de feedback silencioso.
 */

import { z } from 'zod';

// ============================================
// Feedback Schemas
// ============================================

/**
 * Schema para toggle de feedback
 */
export const ToggleFeedbackInputSchema = z.object({
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
  hasDoubt: z.boolean(),
});

export type ToggleFeedbackInput = z.infer<typeof ToggleFeedbackInputSchema>;

/**
 * Status do feedback
 */
export const FeedbackStatusSchema = z.enum(['active', 'resolved']);

export type FeedbackStatus = z.infer<typeof FeedbackStatusSchema>;

/**
 * Schema para feedback completo
 */
export const SilentFeedbackSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
  participantName: z.string().min(1),
  hasDoubt: z.boolean(),
  status: FeedbackStatusSchema.optional(),
  updatedAt: z.string().datetime(),
});

export type SilentFeedback = z.infer<typeof SilentFeedbackSchema>;

/**
 * Schema para lista de feedbacks (resposta da API)
 */
export const FeedbackListResponseSchema = z.object({
  confusedCount: z.number().int().min(0),
  students: z.array(z.object({
    participantId: z.string().min(1),
    participantName: z.string().min(1),
    since: z.string().datetime(),
  })),
});

export type FeedbackListResponse = z.infer<typeof FeedbackListResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Valida input de toggle de feedback
 */
export function validateToggleFeedback(input: unknown): ToggleFeedbackInput {
  return ToggleFeedbackInputSchema.parse(input);
}

/**
 * Valida feedback com safe parse
 */
export function safeValidateFeedback(data: unknown): { success: boolean; data?: SilentFeedback; error?: z.ZodError } {
  const result = SilentFeedbackSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
