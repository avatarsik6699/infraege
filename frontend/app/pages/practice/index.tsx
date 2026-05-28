import { PracticeTrainer } from '@features/practice-trainer/practice-trainer';
import { buildRouteMeta } from '@shared/lib/seo';
import { isNonEmptyString } from '@shared/lib/type-guards';

export function practiceRouteMeta() {
	return buildRouteMeta({
		pathname: '/practice',
		title: 'Практика',
		description: 'Тренажер ЕГЭ по информатике с локальным гостевым прогрессом.',
		profile: 'publicNoIndex',
	});
}

export default function PracticePage({ taskId }: { taskId?: string }) {
	if (!isNonEmptyString(taskId)) {
		throw new Response('Practice task id is required', { status: 400 });
	}

	return <PracticeTrainer taskId={taskId} />;
}
