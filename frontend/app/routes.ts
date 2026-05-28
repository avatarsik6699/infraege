import { index, route } from '@react-router/dev/routes';

export default [
	index('./routes/_index.tsx'),
	route('topics', './routes/topics.tsx'),
	route('tasks/:slug', './routes/task.tsx'),
	route('practice/:id', './routes/practice.tsx'),
	route('login', './routes/login.tsx'),
	route('register', './routes/register.tsx'),
	route('profile', './routes/profile.tsx'),
	route('dashboard', './routes/dashboard.tsx'),
	route('privacy', './routes/privacy.tsx'),
	route('terms', './routes/terms.tsx'),
	route('admin/feedback', './routes/admin-feedback.tsx'),
];
