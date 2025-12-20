/**
 * Schemas - Barrel Export
 * 
 * Exporta todos os schemas Zod para uso nos services e componentes.
 */

// Session schemas
export {
  SessionStatusSchema,
  CreateSessionInputSchema,
  SessionSchema,
  SessionDTOSchema,
  CreateSessionResponseSchema,
  validateCreateSessionInput,
  safeValidateSession,
  type SessionStatus,
  type CreateSessionInput,
  type Session,
  type SessionDTO,
  type CreateSessionResponse,
} from './session.schema';

// Attendance schemas
export {
  RegisterAttendanceInputSchema,
  AttendanceLogSchema,
  AttendanceResponseSchema,
  validateRegisterAttendance,
  safeValidateAttendance,
  type RegisterAttendanceInput,
  type AttendanceLog,
  type AttendanceResponse,
} from './attendance.schema';

// Feedback schemas
export {
  ToggleFeedbackInputSchema,
  FeedbackStatusSchema,
  SilentFeedbackSchema,
  FeedbackListResponseSchema,
  validateToggleFeedback,
  safeValidateFeedback,
  type ToggleFeedbackInput,
  type FeedbackStatus,
  type SilentFeedback,
  type FeedbackListResponse,
} from './feedback.schema';

// User schemas
export {
  UserRoleSchema,
  UserSchema,
  ParticipantSchema,
  ErrorResponseSchema,
  isValidEmail,
  isValidUrl,
  isValidUUID,
  sanitizeString,
  type UserRole,
  type User,
  type Participant,
  type ErrorResponse,
} from './user.schema';
