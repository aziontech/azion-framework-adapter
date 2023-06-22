 // fix-prerendered
export type PrerenderedFileData = {
	headers?: Record<string, string>;
	overrides?: string[];
};

export type VercelPrerenderConfig = {
	type: string;
	sourcePath?: string;
	fallback: { type: string; mode: number; fsPath: string };
	initialHeaders?: Record<string, string>;
};

export type VercelConfig = {
	version: 3;
	routes?: VercelRoute[];
	images?: VercelImagesConfig;
	wildcard?: VercelWildcardConfig;
	overrides?: VercelOverrideConfig;
	framework?: { version: string };
	cache?: string[];
	crons?: VercelCronsConfig;
};

//process-mapping-service
export type ProcessedVercelOutput = {
	vercelConfig: ProcessedVercelConfig;
	vercelOutput: ProcessedVercelBuildOutput;
};