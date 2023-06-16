type WasmModuleInfo = {
	identifier: string;
	importPath: string;
	originalFileLocation: string;
};

type PrerenderedFileData = {
	headers?: Record<string, string>;
	overrides?: string[];
};

type ApplicationMapping = {
    invalidFunctions: Set<string>;
    functionsMap: Map<string, string>;
    webpackChunks: Map<number, string>;
    wasmIdentifiers: Map<string, WasmModuleInfo>;  
    prerenderedRoutes: Map<string, PrerenderedFileData>;  
}

type RawWasmModuleInfo = {
	identifier: string;
	importPath: string;
	start: number;
	end: number;
};

type VercelPrerenderConfig = {
	type: string;
	sourcePath?: string;
	fallback: { type: string; mode: number; fsPath: string };
	initialHeaders?: Record<string, string>;
};

type ProcessedVercelOutput = {
	vercelConfig: ProcessedVercelConfig;
	vercelOutput: ProcessedVercelBuildOutput;
};

type VcConfigObject = {
	path: string;
	content: VercelFunctionConfig;
}