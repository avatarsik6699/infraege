import { forwardRef, type ComponentProps } from 'react';
import { Link } from 'react-router';

export const AppLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof Link>>(function AppLink(props, ref) {
	return <Link ref={ref} {...props} />;
});
