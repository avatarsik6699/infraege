import TaskPage, { loadTaskPage, taskRouteMeta, type TaskRouteData } from '@pages/task';

export function meta({ data }: { data?: TaskRouteData }) {
	return taskRouteMeta(data);
}

export async function loader({ params }: { params: { slug?: string } }): Promise<TaskRouteData> {
	return loadTaskPage(params);
}

export default function TaskRoute({ loaderData }: { loaderData: TaskRouteData }) {
	return <TaskPage task={loaderData.task} />;
}
