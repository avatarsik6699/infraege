import { browser } from '@shared/lib/browser';

export type TimeoutHandle = number;
export type IntervalHandle = number;
export type AnimationFrameHandle = number;

function safeSetTimeout(handler: TimerHandler, timeout?: number): TimeoutHandle | null {
	return browser.getWindow()?.setTimeout(handler, timeout) ?? null;
}

function safeClearTimeout(handle: TimeoutHandle | null | undefined): void {
	if (handle === null || handle === undefined) {
		return;
	}

	browser.getWindow()?.clearTimeout(handle);
}

function safeSetInterval(handler: TimerHandler, timeout?: number): IntervalHandle | null {
	return browser.getWindow()?.setInterval(handler, timeout) ?? null;
}

function safeClearInterval(handle: IntervalHandle | null | undefined): void {
	if (handle === null || handle === undefined) {
		return;
	}

	browser.getWindow()?.clearInterval(handle);
}

function safeRequestAnimationFrame(callback: FrameRequestCallback): AnimationFrameHandle | null {
	return browser.getWindow()?.requestAnimationFrame(callback) ?? null;
}

function safeCancelAnimationFrame(handle: AnimationFrameHandle | null | undefined): void {
	if (handle === null || handle === undefined) {
		return;
	}

	browser.getWindow()?.cancelAnimationFrame(handle);
}

export const timers = {
	setTimeout: safeSetTimeout,
	clearTimeout: safeClearTimeout,
	setInterval: safeSetInterval,
	clearInterval: safeClearInterval,
	requestAnimationFrame: safeRequestAnimationFrame,
	cancelAnimationFrame: safeCancelAnimationFrame,
} as const;
