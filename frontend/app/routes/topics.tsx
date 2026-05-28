import TopicsPage, { loadTopicsPage } from '@pages/topics';
import { buildCatalogMeta } from '@shared/lib/seo';

export function meta() {
	return buildCatalogMeta();
}

export async function loader() {
	return loadTopicsPage();
}

export default function TopicsRoute({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
	return <TopicsPage tasks={loaderData.tasks} />;
}
