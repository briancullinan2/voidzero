export interface TierRule
{
	name: string;
	description: string;
	patterns: (string | RegExp)[];
}

export const PROJECT_LAYOUT_TIERS: TierRule[] = [
	{
		name: "Build Config",
		description: "Orchestration, containerization, dependency manifests, and compiler/bundler configurations.",
		patterns: [
			/(^|\/)(Dockerfile|docker-compose|k8s|helm|\.github|jenkins|gitlab-ci|\.env)/i,
			/(^|\/)(webpack|vite|rollup|babel|tsconfig|jsconfig|package\.json|Cargo\.toml|go\.mod|requirements\.txt|pyproject\.toml|Makefile|CMakeLists\.txt)/i
		]
	},
	{
		name: "Documentation",
		description: "Markdown guides, project wikis, media files, font packages, and raw static deliverables.",
		patterns: [
			/(^|\/)(docs?|assets|static|public|media|images?|fonts?|locales?|resources?)(\/|$)/i,
			/\.(md|png|jpg|jpeg|svg|ico|pdf|zip|woff|woff2|ttf|eot)$/i,
			/(^|\/)README/i
		]
	},
	{
		name: "Databases",
		description: "Data models, ORM definitions, SQL statements, migration scripts, and seed files.",
		patterns: [
			/(^|\/)(migrations?|seeds?|prisma|schema|entities|models?|sql|db)(\/|$)/i,
			/\.(sql|prisma|graphql|proto)$/i
		]
	},
	{
		name: "Services",
		description: "Web workers, background daemons, network proxies, socket handlers, and async task queues.",
		patterns: [
			/(^|\/)(workers?|services?|daemons?|proxies|proxy|queues?|jobs?|rpc|tasks?|wasm)(\/|$)/i,
			/(worker|proxy|socket|daemon|queue)\.(js|ts|mjs|py|rs)$/i
		]
	},
	{
		name: "Routing",
		description: "HTTP endpoints, server route handlers, RPC controllers, and gateway dispatchers.",
		patterns: [
			/(^|\/)(routes?|controllers?|api|endpoints?|handlers?|views\/http|actions?)(\/|$)/i,
			/(route|controller|endpoint|handler)\.(js|ts|py|go|rs)$/i
		]
	},
	{
		name: "Components",
		description: "User interface widgets, page templates, style sheets, themes, and view components.",
		patterns: [
			/(^|\/)(components?|views?|pages?|ui|widgets?|layouts?|styles?|templates?|css|themes?|screens?)(\/|$)/i,
			/\.(css|scss|less|html|jsx|tsx|vue|svelte)$/i
		]
	},
	{
		name: "Libraries",
		description: "Shared code, formatting extensions, mathematical helpers, and internal library wrappers.",
		patterns: [
			/(^|\/)(utils?|helpers?|lib|common|shared|extensions?|node_modules|\.nuget|core|mixins?|parsers?)(\/|$)/i
		]
	},
	{
		name: "Testing",
		description: "Unit tests, integration suites, test fixtures, mock data, and performance benchmarks.",
		patterns: [
			/(^|\/)(tests?|__tests__|spec|benchmarks?|mocks?|fixtures?)(\/|$)/i,
			/\.(test|spec)\.(js|ts|py|rs|go)$/i
		]
	}
];

export interface ContentTagRule
{
	tag: string;
	category: string;
	pattern: RegExp;
}

export const CONTENT_FAST_SCAN_RULES: ContentTagRule[] = [
	{
		tag: 'IMPORTS_MODULE',
		category: 'Dependency',
		pattern: /(?:import\s+.*?from\s+['"][^'"]+['"]|require\s*\(?\s*['"][^'"]+['"]\s*\)?|#include\s*<|use\s+[\w:]+;|import\s+[\w.]+)/g
	},
	{
		tag: 'EXPORTS_API',
		category: 'Export',
		pattern: /(?:export\s+(?:default\s+)?(?:class|function|const|let|interface|type)|module\.exports\s*=|pub\s+fn\s+|func\s+\w+\()/g
	},
	{
		tag: 'HAS_DATABASE',
		category: 'Data Layer',
		pattern: /(?:mongoose|sequelize|prisma|sql|pg|pool|sqlite|redis|mongodb|QueryInterface|Client\s*\()/i
	},
	{
		tag: 'HAS_HTTP_ROUTER',
		category: 'API Layer',
		pattern: /(?:express\s*\(|fastify\s*\(|router\.(?:get|post|put|delete)|app\.(?:get|post|put|delete)|Axum::new|warp::)/i
	},
	{
		tag: 'HAS_WORKER_THREAD',
		category: 'Concurrency',
		pattern: /(?:new\s+Worker\s*\(|postMessage|onmessage|Cluster\.|spawn\s*\(|tokio::task)/i
	},
	{
		tag: 'HAS_UI_RENDER',
		category: 'Presentation',
		pattern: /(?:createElement|jsx|<[A-Z]\w*|render\s*\(|template\s*:|styled\.\w+)/i
	}
];

export function fastScanFileContent(content: string): string[]
{
	const matchedTags: string[] = [];
	for(const rule of CONTENT_FAST_SCAN_RULES)
	{
		if(rule.pattern.test(content))
		{
			matchedTags.push(rule.tag);
		}
		// Reset regex state for global searches if needed
		rule.pattern.lastIndex = 0;
	}
	return matchedTags;
}
