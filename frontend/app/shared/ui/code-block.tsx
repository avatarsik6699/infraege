type CodeBlockProps = {
	code: string;
	language?: string | null;
	title?: string | null;
};

export function CodeBlock({ code, language, title }: CodeBlockProps) {
	const hasTitle = title !== undefined && title !== null && title.trim() !== '';

	return (
		<figure className='code-block'>
			{hasTitle ? <figcaption>{title}</figcaption> : null}
			<pre>
				<code data-language={language ?? undefined}>{code}</code>
			</pre>
		</figure>
	);
}
