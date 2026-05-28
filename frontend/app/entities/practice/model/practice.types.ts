import type { components } from '@shared/types/schema';

export type PublicPracticeItem = components['schemas']['PublicPracticeItem'];
export type PracticeValidationRequest = components['schemas']['PracticeValidationRequest'];
export type PracticeValidationResponse = components['schemas']['PracticeValidationResponse'];

export type PracticeTrainerState = 'neutral' | 'correct' | 'incorrect';
