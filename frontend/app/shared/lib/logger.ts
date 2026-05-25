import { runtime } from '@shared/config/runtime';

type LogMethod = 'debug' | 'info' | 'warn' | 'error';
type LogContext = unknown;

function shouldLog(method: LogMethod): boolean {
	return runtime.isDev || method === 'warn' || method === 'error';
}

function write(method: LogMethod, message: string, context?: LogContext): void {
	if (!shouldLog(method)) {
		return;
	}

	try {
		if (context === undefined) {
			globalThis.console?.[method](message);
			return;
		}

		globalThis.console?.[method](message, context);
	} catch {
		return;
	}
}

export const logger = {
	debug(message: string, context?: LogContext): void {
		write('debug', message, context);
	},
	info(message: string, context?: LogContext): void {
		write('info', message, context);
	},
	warn(message: string, context?: LogContext): void {
		write('warn', message, context);
	},
	error(message: string, context?: LogContext): void {
		write('error', message, context);
	},
} as const;
