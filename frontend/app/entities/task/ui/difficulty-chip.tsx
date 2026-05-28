import type { TaskDifficulty } from '../model/task.types';
import { taskDifficultyLabels } from '../model/task.types';

type DifficultyChipProps = {
	difficulty: TaskDifficulty;
};

const difficultyClassName: Record<TaskDifficulty, string> = {
	basic: 'difficulty-chip difficulty-chip-basic',
	medium: 'difficulty-chip difficulty-chip-medium',
	high: 'difficulty-chip difficulty-chip-high',
};

export function DifficultyChip({ difficulty }: DifficultyChipProps) {
	return <span className={difficultyClassName[difficulty]}>{taskDifficultyLabels[difficulty]}</span>;
}
