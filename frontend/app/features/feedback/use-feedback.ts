import { useState } from 'react';

import { submitFeedback } from '@entities/feedback/api/feedback';
import { ApiError } from '@shared/api/client';

type FeedbackState =
	| { phase: 'idle' }
	| { phase: 'loading' }
	| { phase: 'success' }
	| { phase: 'error'; message: string };

type UseFeedbackReturn = {
	state: FeedbackState;
	submit: (pageUrl: string, message: string) => Promise<void>;
	reset: () => void;
};

export function useFeedback(): UseFeedbackReturn {
	const [state, setState] = useState<FeedbackState>({ phase: 'idle' });

	async function submit(pageUrl: string, message: string): Promise<void> {
		setState({ phase: 'loading' });
		try {
			await submitFeedback({ page_url: pageUrl, message, honeypot: '' });
			setState({ phase: 'success' });
		} catch (err) {
			const msg =
				err instanceof ApiError
					? typeof err.detail === 'string'
						? err.detail
						: 'Ошибка при отправке'
					: 'Ошибка при отправке';
			setState({ phase: 'error', message: msg });
		}
	}

	function reset() {
		setState({ phase: 'idle' });
	}

	return { state, submit, reset };
}
