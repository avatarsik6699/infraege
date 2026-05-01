type NotifyErrorFn = (message: string) => void;

const noopNotifyError: NotifyErrorFn = () => undefined;

let notifyError: NotifyErrorFn = noopNotifyError;

export const globalErrorNotifier = {
	notifyError(message: string): void {
		notifyError(message);
	},
	setNotifyError(nextNotifyError: NotifyErrorFn): void {
		notifyError = nextNotifyError;
	},
	reset(): void {
		notifyError = noopNotifyError;
	},
};
