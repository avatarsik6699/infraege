import { Search, X } from 'lucide-react';

import type { CatalogFilters, TaskDifficulty } from '@entities/task/model/task.types';
import { taskDifficultyLabels } from '@entities/task/model/task.types';
import { Button } from '@shared/ui/button';

type TaskFilterBarProps = {
	filters: CatalogFilters;
	onChange: (filters: CatalogFilters) => void;
	resultCount: number;
};

const difficulties: Array<{ value?: TaskDifficulty; label: string }> = [
	{ label: 'Все' },
	{ value: 'basic', label: taskDifficultyLabels.basic },
	{ value: 'medium', label: taskDifficultyLabels.medium },
	{ value: 'high', label: taskDifficultyLabels.high },
];

export function TaskFilterBar({ filters, onChange, resultCount }: TaskFilterBarProps) {
	const hasActiveFilters = filters.search.trim() !== '' || filters.difficulty !== undefined;

	return (
		<section className='catalog-filter-bar' aria-label='Фильтры каталога'>
			<label className='catalog-search'>
				<Search aria-hidden='true' className='size-4' />
				<input
					type='search'
					value={filters.search}
					placeholder='Поиск по номеру, теме или описанию'
					onChange={event => onChange({ ...filters, search: event.target.value })}
				/>
			</label>
			<div className='catalog-segments' role='group' aria-label='Сложность'>
				{difficulties.map(item => {
					const isActive =
						filters.difficulty === item.value || (filters.difficulty === undefined && item.value === undefined);
					return (
						<button
							key={item.value ?? 'all'}
							type='button'
							className='catalog-segment'
							aria-pressed={isActive}
							data-active={isActive ? 'true' : undefined}
							onClick={() => onChange({ ...filters, difficulty: item.value })}
						>
							{item.label}
						</button>
					);
				})}
			</div>
			<div className='catalog-filter-meta'>
				<span>{resultCount} заданий</span>
				{hasActiveFilters ? (
					<Button
						type='button'
						size='sm'
						variant='ghost'
						onClick={() => onChange({ search: '' })}
						aria-label='Сбросить фильтры'
					>
						<X aria-hidden='true' className='size-4' />
						Сбросить
					</Button>
				) : null}
			</div>
		</section>
	);
}
