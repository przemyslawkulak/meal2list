import { Database } from '../../../../db/database.types';

// Database types
export type UserLimit = Database['public']['Tables']['user_limits']['Row'];
export type UserLimitInsert = Database['public']['Tables']['user_limits']['Insert'];
export type UserLimitUpdate = Database['public']['Tables']['user_limits']['Update'];

export type UsageHistory = Database['public']['Tables']['usage_history']['Row'];
export type UsageHistoryInsert = Database['public']['Tables']['usage_history']['Insert'];
export type UsageHistoryUpdate = Database['public']['Tables']['usage_history']['Update'];

// Service DTOs
export interface LimitStatus {
  hasLimit: boolean;
  currentUsage: number;
  monthlyLimit: number;
  resetDate: Date;
  canProcess: boolean;
  remainingGenerations: number;
}

export interface UsageIncrement {
  newUsage: number;
  limitReached: boolean;
  resetDate: Date;
}

export interface MonthPeriod {
  start: Date;
  end: Date;
}

// Error types
export interface LimitExceededError {
  code: 'LIMIT_EXCEEDED';
  message: string;
  resetDate: Date;
  currentUsage: number;
  monthlyLimit: number;
}

export interface UserLimitError {
  code: 'USER_LIMIT_ERROR';
  message: string;
  originalError?: Error | unknown;
}

export interface DatabaseConnectionError {
  code: 'DATABASE_CONNECTION_ERROR';
  message: string;
  originalError?: Error | unknown;
}

export interface InvalidLimitValueError {
  code: 'INVALID_LIMIT_VALUE';
  message: string;
  value: number;
}

export interface ConcurrentAccessError {
  code: 'CONCURRENT_ACCESS_ERROR';
  message: string;
  originalError?: Error | unknown;
}

// Union type for all possible errors
export type UserLimitServiceError =
  | LimitExceededError
  | UserLimitError
  | DatabaseConnectionError
  | InvalidLimitValueError
  | ConcurrentAccessError;

// Function return types for database functions
export interface IncrementUsageResult {
  new_usage: number;
  monthly_limit: number;
  limit_reached: boolean;
  reset_date: string;
}

// Event types for logging
export type LimitEventType = 'check' | 'increment' | 'exceeded' | 'reset' | 'update';

export interface LimitEventMetadata {
  userId: string;
  eventType: LimitEventType;
  timestamp: Date;
  previousUsage?: number;
  newUsage?: number;
  limitValue?: number;
  resetDate?: Date;
  currentUsage?: number;
  monthlyLimit?: number;
  canProcess?: boolean;
  remainingGenerations?: number;
  limitReached?: boolean;
  action?: string;
  months?: number;
  recordCount?: number;
  [key: string]: unknown;
}
