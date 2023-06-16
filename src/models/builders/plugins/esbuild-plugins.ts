// Docs: https://esbuild.github.io/plugins/

export const nodeBuiltInModulesPlugin=  {
    name: 'node:built-in:modules',
    setup(build: any) {
        build.onResolve({ filter: /^node:/ }, ({ kind, path }: any) => {
            // this plugin converts `require("node:*")` calls, those are the only ones that
            // need updating (esm imports to "node:*" are totally valid), so here we tag with the
            // node-buffer namespace only imports that are require calls
            return kind === 'require-call'
                ? {
                    path: path.replace("node:", ""),
                    namespace: 'node-built-in-modules',
                }
                : undefined;
        });

        // we convert the imports we tagged with the node-built-in-modules namespace so that instead of `require("node:*")`
        // they import from `export * from "node:*";`
        build.onLoad(
            { filter: /.*/, namespace: 'node-built-in-modules' },
            ({ path }: any) => {
                return {
                    contents: `export * from '${path}'`,
                    loader: 'js',
                };
            }
        );
    },
};