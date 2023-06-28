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

export type ProcessedVercelOutput = {
	vercelConfig: ProcessedVercelConfig;
	vercelOutput: ProcessedVercelBuildOutput;
};

export type ApplicationMapping = {
    invalidFunctions: Set<string>;
    functionsMap: Map<string, string>;
    webpackChunks: Map<number, string>;
    wasmIdentifiers: Map<string, WasmModuleInfo>;  
    prerenderedRoutes: Map<string, PrerenderedFileData>;  
}

export type WasmModuleInfo = {
	identifier: string;
	importPath: string;
	originalFileLocation: string;
};
