import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { validatePracticeAnswer } from '@entities/practice/api/practice';
import { publicPracticeQueryOptions } from '@entities/practice/api/practice-queries';
import type {
	PracticeTrainerState,
	PracticeValidationRequest,
	PracticeValidationResponse,
} from '@entities/practice/model/practice.types';
import { useGuestProgress } from '@features/guest-progress/use-guest-progress';
import { sanitizeTheoryHtml } from '@shared/lib/sanitize';
import { isNonEmptyString } from '@shared/lib/type-guards';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';
import { CodeBlock } from '@shared/ui/code-block';
import { Input } from '@shared/ui/input';
import { Skeleton } from '@shared/ui/skeleton';

type PracticeTrainerProps = {
	taskId: string;
};

function PracticeTrainerSkeleton() {
	return (
		<main className='page-shell practice-page' aria-busy='true' aria-live='polite' aria-label='Загрузка тренажера'>
			<header className='practice-header'>
				<div className='space-y-3'>
					<Skeleton className='h-3 w-24' />
					<Skeleton className='h-10 w-full max-w-lg' />
					<Skeleton className='h-5 w-full max-w-xl' />
				</div>
				<div className='practice-header-meta'>
					<Skeleton className='h-7 w-10' />
					<Skeleton className='h-3 w-12' />
				</div>
			</header>
			<section className='practice-progress'>
				<div>
					<Skeleton className='h-4 w-36' />
					<Skeleton className='h-4 w-10' />
				</div>
				<Skeleton className='h-2 w-full rounded-full' />
			</section>
			<section className='practice-layout'>
				<article className='practice-task-panel'>
					<div className='practice-task-meta'>
						<Skeleton className='h-6 w-20' />
						<Skeleton className='h-6 w-14' />
					</div>
					<Skeleton className='h-5 w-full' />
					<Skeleton className='h-5 w-11/12' />
					<Skeleton className='h-28 w-full' />
				</article>
				<div className='practice-answer-panel'>
					<Skeleton className='h-4 w-16' />
					<Skeleton className='h-11 w-full' />
					<Skeleton className='h-24 w-full' />
					<div className='practice-actions'>
						<Skeleton className='h-9 w-full' />
						<Skeleton className='h-9 w-full' />
						<Skeleton className='h-9 w-full' />
					</div>
				</div>
			</section>
			<span className='sr-only'>Загружаем тренажер</span>
		</main>
	);
}

export function PracticeTrainer({ taskId }: PracticeTrainerProps) {
	const practiceQuery = useQuery(publicPracticeQueryOptions(taskId));
	const { progress, recordAttempt, getSolvedCount } = useGuestProgress();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answer, setAnswer] = useState('');
	const [feedback, setFeedback] = useState<PracticeValidationResponse | null>(null);

	const items = useMemo(() => practiceQuery.data ?? [], [practiceQuery.data]);
	const currentItem = items[currentIndex];
	const itemIds = useMemo(() => items.map(item => item.id), [items]);
	const solvedCount = getSolvedCount(itemIds);
	const trainerState: PracticeTrainerState = feedback === null ? 'neutral' : feedback.correct ? 'correct' : 'incorrect';
	const progressPercent = items.length === 0 ? 0 : Math.round((solvedCount / items.length) * 100);
	const canGoNext = currentIndex < items.length - 1;
	const canGoPrevious = currentIndex > 0;

	const validationMutation = useMutation<PracticeValidationResponse, Error, PracticeValidationRequest>({
		mutationKey: ['practice', 'validate'],
		mutationFn: payload => validatePracticeAnswer(payload),
		onSuccess: result => {
			if (currentItem === undefined) return;
			setFeedback(result);
			recordAttempt({
				itemId: currentItem.id,
				taskId: currentItem.taskId,
				answer,
				isCorrect: result.correct,
			});
		},
	});

	if (practiceQuery.isPending) {
		return <PracticeTrainerSkeleton />;
	}

	if (practiceQuery.isError) {
		return (
			<main className='page-shell practice-page'>
				<section className='practice-state-panel' role='alert'>
					<XCircle aria-hidden='true' className='size-5' />
					<h1 className='serif page-title'>Практика недоступна</h1>
					<p>Не удалось получить задания. Попробуйте обновить страницу.</p>
					<Button type='button' onClick={() => void practiceQuery.refetch()}>
						<RotateCcw aria-hidden='true' className='size-4' />
						Повторить
					</Button>
				</section>
			</main>
		);
	}

	if (items.length === 0 || currentItem === undefined) {
		return (
			<main className='page-shell practice-page'>
				<section className='practice-state-panel'>
					<h1 className='serif page-title'>Практика скоро появится</h1>
					<p>Для этого задания пока нет опубликованных тренировочных вопросов.</p>
					<Button asChild variant='outline'>
						<AppLink to='/topics'>К каталогу</AppLink>
					</Button>
				</section>
			</main>
		);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (currentItem === undefined || !isNonEmptyString(answer.trim())) return;
		validationMutation.mutate({
			itemId: currentItem.id,
			answer,
		});
	}

	function move(delta: number) {
		setCurrentIndex(index => Math.min(Math.max(index + delta, 0), items.length - 1));
		setAnswer('');
		setFeedback(null);
		validationMutation.reset();
	}

	const lastAttempt = progress.attempts[currentItem.id];

	return (
		<main className='page-shell practice-page'>
			<header className='practice-header'>
				<div>
					<p className='kicker'>Задание {currentItem.egeNumber}</p>
					<h1 className='serif page-title'>{currentItem.taskTitle}</h1>
					<p className='lede'>Тренируйтесь без регистрации. Ответы сохраняются в этом браузере.</p>
				</div>
				<div className='practice-header-meta' aria-label='Прогресс тренировки'>
					<strong>{progress.streak}</strong>
					<span>серия</span>
				</div>
			</header>

			<section className='practice-progress' aria-label='Решено в этом браузере'>
				<div>
					<span>
						Решено {solvedCount} из {items.length}
					</span>
					<span>{progressPercent}%</span>
				</div>
				<progress value={solvedCount} max={items.length} />
			</section>

			<section className='practice-layout'>
				<article className='practice-task-panel'>
					<div className='practice-task-meta'>
						<span>Вопрос {currentIndex + 1}</span>
						{currentItem.year === null ? null : <span>{currentItem.year}</span>}
						{lastAttempt?.isCorrect === true ? <span data-solved='true'>Решено</span> : null}
					</div>
					<div
						className='practice-prompt'
						dangerouslySetInnerHTML={{ __html: sanitizeTheoryHtml(currentItem.promptHtml) }}
					/>
					{currentItem.codeBlock === null ? null : (
						<CodeBlock
							code={currentItem.codeBlock.code}
							language={currentItem.codeBlock.language}
							title={currentItem.codeBlock.title}
						/>
					)}
				</article>

				<form className='practice-answer-panel' data-state={trainerState} onSubmit={handleSubmit}>
					<label>
						<span>Ответ</span>
						<Input
							value={answer}
							onChange={event => {
								setAnswer(event.target.value);
								setFeedback(null);
							}}
							maxLength={200}
							autoComplete='off'
							aria-invalid={trainerState === 'incorrect'}
							placeholder='Введите краткий ответ'
						/>
					</label>

					<div className='practice-feedback' aria-live='polite'>
						{feedback === null ? (
							<p>Введите ответ и проверьте его сразу.</p>
						) : feedback.correct ? (
							<p>
								<CheckCircle2 aria-hidden='true' className='size-4' />
								Верно
							</p>
						) : (
							<p>
								<XCircle aria-hidden='true' className='size-4' />
								Неверно. Ответ: {feedback.expectedValue}
							</p>
						)}
						{feedback?.explanationHtml === undefined || feedback.explanationHtml === null ? null : (
							<div
								className='practice-explanation'
								dangerouslySetInnerHTML={{ __html: sanitizeTheoryHtml(feedback.explanationHtml) }}
							/>
						)}
					</div>

					<div className='practice-actions'>
						<Button type='submit' disabled={!isNonEmptyString(answer.trim()) || validationMutation.isPending}>
							{validationMutation.isPending ? <Loader2 aria-hidden='true' className='size-4 animate-spin' /> : null}
							Проверить
						</Button>
						<Button type='button' variant='outline' disabled={!canGoPrevious} onClick={() => move(-1)}>
							<ArrowLeft aria-hidden='true' className='size-4' />
							Назад
						</Button>
						{canGoNext ? (
							<Button type='button' variant='outline' onClick={() => move(1)}>
								Дальше
								<ArrowRight aria-hidden='true' className='size-4' />
							</Button>
						) : (
							<Button asChild variant='outline'>
								<AppLink to={`/tasks/${currentItem.taskSlug}`}>К теории</AppLink>
							</Button>
						)}
					</div>
				</form>
			</section>
		</main>
	);
}
