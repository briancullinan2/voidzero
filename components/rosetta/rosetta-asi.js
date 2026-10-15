// @ts-check
import antlr4 from 'antlr4';
// import { PreprocessorLexer } from './antlr-languages.bundle';

// A minimal lookahead map of tokens that CANNOT start a expression line
// without a preceding semicolon safely in place.
// TODO: make C do this on save
const UNSAFE_LINE_STARTERS = ['[', '(', '`', '/', '+', '-'];

/**
 *
 * @param {*} tokenStream
 * @returns
 */
function processJavaScriptASI(tokenStream)
{
	const tokens = tokenStream.getTokens();
	const modifiedTokens = [];
	const asiErrors = []; // Collect discovered bugs here for your UX

	for(let i = 0; i < tokens.length; i++)
	{
		const currentToken = tokens[i];
		const nextToken = tokens[i + 1];

		modifiedTokens.push(currentToken);

		// Check if we are crossing a line break between two valid tokens
		if(nextToken && currentToken.line < nextToken.line)
		{

			// BUG DETECTION 1: The Restricted Production Rule (return, break, continue, throw)
			if(['return', 'break', 'continue', 'throw'].includes(currentToken.text))
			{
				asiErrors.push({
					line: currentToken.line,
					column: currentToken.column,
					message: `Critical ASI Warning: Inline split after '${currentToken.text}'. Semicolon automatically inserted here, making subsequent code unreachable.`
				});

				// Synthesize a real semicolon token for your Pass-2 parser
				modifiedTokens.push({ type: PreprocessorLexer.SEMICOLON, text: ";" });
				continue;
			}

			// BUG DETECTION 2: The Unsafe Continuation Danger Zone
			if(UNSAFE_LINE_STARTERS.includes(nextToken.text))
			{
				// If the current line does NOT end with an explicit semicolon,
				// and the next line starts with an unsafe character, it's a critical hazard.
				if(currentToken.text !== ';' && currentToken.text !== '}')
				{
					asiErrors.push({
						line: nextToken.line,
						column: nextToken.column,
						message: `Potential Code Breaking Bug: Missing semicolon before leading '${nextToken.text}'. JS engine will attempt to parse this as a continuation of the previous line.`
					});
				}
			}

			// STANDARD ASI INSIGHT: Tagging normal missing semis for AST alignment
			if(requiresImplicitSemicolon(currentToken, nextToken))
			{
				modifiedTokens.push({
					type: PreprocessorLexer.SEMICOLON,
					text: ";",
					isVirtual: true // Flagged so you can recognize it down the line
				});
			}
		}
	}

	// Expose detected bugs out to your UX panel or worker messenger
	if(asiErrors.length > 0)
	{
		self.postMessage({ type: "asiDiagnosticsDiscovered", errors: asiErrors });
	}

	return new antlr4.CommonTokenStream(new VirtualTokenSource(modifiedTokens));
}

/**
 *
 * @param {*} current
 * @param {*} next
 * @returns
 */
function requiresImplicitSemicolon(current, next)
{
	// Avoid double semicolons or inserting after structural blocks
	if([';', '{', '}'].includes(current.text) || ['}'].includes(next.text)) return false;

	// Core check: If the upcoming token cannot natively chain off the current token
	// (e.g., an identifier followed by another identifier on a new line)
	return (current.type === PreprocessorLexer.IDENTIFIER && next.type === PreprocessorLexer.IDENTIFIER);
}

