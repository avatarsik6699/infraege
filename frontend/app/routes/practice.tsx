import { useParams } from 'react-router';

import PracticePage, { practiceRouteMeta } from '@pages/practice';

export function meta() {
	return practiceRouteMeta();
}

export default function PracticeRoute() {
	const params = useParams();
	return <PracticePage taskId={params.id} />;
}
