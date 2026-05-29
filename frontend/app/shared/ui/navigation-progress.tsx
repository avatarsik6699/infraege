import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

import { Progress } from '@shared/ui/progress';

const SHOW_DELAY_MS = 120;

export function NavigationProgressView({ isVisible, value }: { isVisible: boolean; value: number }) {
	if (!isVisible) {
		return null;
	}

	return (
		<div className='fixed inset-x-0 top-0 z-[60] h-1' aria-label='Загрузка страницы'>
			<Progress value={value} className='h-1 rounded-none bg-transparent' />
		</div>
	);
}

export function NavigationProgress() {
	const navigation = useNavigation();
	const isNavigating = navigation.state !== 'idle' || Boolean(navigation.location);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!isNavigating) {
			setIsVisible(false);
			return undefined;
		}

		const timer = window.setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [isNavigating]);

	if (!isVisible) {
		return null;
	}

	return <NavigationProgressView isVisible={isVisible} value={navigation.state === 'submitting' ? 55 : 78} />;
}
