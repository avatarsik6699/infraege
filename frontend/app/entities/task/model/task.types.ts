import type { components } from '@shared/types/schema';

export type TaskDifficulty = components['schemas']['TaskDifficulty'];
export type TheoryTocItem = components['schemas']['TheoryTocItem'];
export type AssetManifestItem = components['schemas']['AssetManifestItem'];
export type PublicPracticePreview = components['schemas']['PublicPracticePreview'];
export type PublicTaskSummary = components['schemas']['PublicTaskSummary'];
export type PublicTaskDetail = components['schemas']['PublicTaskDetail'];

export type CatalogFilters = {
	search: string;
	difficulty?: TaskDifficulty;
};

export const taskDifficultyLabels: Record<TaskDifficulty, string> = {
	basic: 'Базовый',
	medium: 'Средний',
	high: 'Высокий',
};
