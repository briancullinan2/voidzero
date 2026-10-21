// Import the actual underlying ANTLR4 package (aliased below as 'antlr4-core')
import antlr4Core from 'antlr4-core';

let sharedAntlr = antlr4Core;

if(typeof self !== 'undefined')
{
	self.AntlrRegistry = self.AntlrRegistry || {};
	if(self.AntlrRegistry.antlr)
	{
		// Reuse the instance already registered by another bundle
		sharedAntlr = self.AntlrRegistry.antlr;
	} else
	{
		// Register this bundle's instance for future bundles to find
		self.AntlrRegistry.antlr = antlr4Core;
	}
}

export default sharedAntlr;
export const {
	Lexer,
	Parser,
	CommonToken,
	Token,
	TokenStream,
	CharStream,
	Interval,
	// Add any other named exports your parsers rely on
} = sharedAntlr;
