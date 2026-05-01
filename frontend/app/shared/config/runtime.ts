type RuntimeSnapshot = {
	isDev: boolean;
	isProd: boolean;
	isServer: boolean;
	isClient: boolean;
	hasWindow: boolean;
	mode: string;
};

function getSnapshot(): RuntimeSnapshot {
	const hasWindow = 'window' in globalThis;
	const isServer = import.meta.env.SSR && !hasWindow;

	return {
		isDev: import.meta.env.DEV,
		isProd: import.meta.env.PROD,
		isServer,
		isClient: !isServer,
		hasWindow,
		mode: import.meta.env.MODE,
	};
}

export const runtime = {
	getSnapshot,
	get isDev() {
		return getSnapshot().isDev;
	},
	get isProd() {
		return getSnapshot().isProd;
	},
	get isServer() {
		return getSnapshot().isServer;
	},
	get isClient() {
		return getSnapshot().isClient;
	},
	get hasWindow() {
		return getSnapshot().hasWindow;
	},
	get mode() {
		return getSnapshot().mode;
	},
} as const;
