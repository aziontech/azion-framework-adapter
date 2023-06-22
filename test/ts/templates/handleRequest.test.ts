import { suite, test, describe, after } from 'mocha';
import { expect } from 'chai';
// import * as sinon from "sinon";
import {
    basicEdgeAppDirTestSet,
    basicStaticAppDirTestSet,
    checkRouteMatchTestSet,
    configRewritesRedirectsHeadersTestSet,
    dynamicRoutesTestSet,
    i18nTestSet,
    infiniteLoopTestSet,
    middlewareTestSet,
    trailingSlashTestSet,
} from './requestTestData';
// import type { TestCase, TestSet } from '../_helpers';
import { createRouterTestData } from './_helpers';
// import type { RequestContext } from '../../src/utils/requestContext';
import { handleRequest } from '../../../dist/templates/handlers/nextjs/handler';
import { writeFile } from 'fs/promises';

chai.spy('acorn', async () => {
    return {
        parse: () => {
            return {
                body: [],
            };
        },
    };
});

/**
 * Runs a test case.
 *
 * @param reqCtx partial request context to use for the tests.
 * @param testCase Test case to run.
 */
function runTestCase(
    reqCtx: any,
    config: any,
    output: any,
    testCase: any
) {
    test(testCase.name, async () => {
        const {
            paths,
            headers,
            host = 'localhost',
            method = 'GET',
            expected,
        } = testCase;

        const urls = paths.map((p: any) => `http://${host}${p}`);
        for (const url of urls) {
            // const mockedConsoleError = sinon
            //     .stub(console, 'error');

            const req = new Request(url, { method, headers });
            const res = await handleRequest(
                { ...reqCtx, request: req },
                config,
                output
            );

            expect(res.status).to.be.equal(expected.status);
            expect(res.text()).to.be.equal(expected.data);
            expect(Object.fromEntries(res.headers.entries())).to.be.equal(
                expected.headers || {}
            );
            if (expected.reqHeaders) {
                expect(Object.fromEntries(req.headers.entries())).to.equal(
                    expected.reqHeaders
                );
            }

            // const consoleErrorExp = expected.mockConsole?.error ?? [];
            // expect(mockedConsoleError).to.be.called();
            // consoleErrorExp.forEach((val: any, i: string | number) => {
            //     expect(mockedConsoleError.mock.calls[i]?.[0]).to.be.equal(val);
            // });

            // mockedConsoleError.mockRestore();
        }
    });
}

/**
 * Runs a test set.
 *
 * @param testSet Test set to run.
 */
async function runTestSet({ config, files, testCases }: any) {
    const { vercelConfig, buildOutput, assetsFetcher, restoreMocks } =
		await createRouterTestData(config, files);

    const reqCtx= {
        assetsFetcher,
        ctx: {} as any,
    };

    testCases.forEach((testCase: any) =>
        runTestCase(reqCtx, vercelConfig, buildOutput, testCase)
    );

    after(() => restoreMocks());
}

chai.spy('esbuild', async () => {
    return {
        build: (options: { stdin?: { contents: string }; outfile: string }) => {
            const contents = options.stdin?.contents ?? 'built code';
            writeFile(options.outfile, contents);
        },
    };
});

suite.only('router', () => {
    [
        basicEdgeAppDirTestSet,
        basicStaticAppDirTestSet,
        checkRouteMatchTestSet,
        configRewritesRedirectsHeadersTestSet,
        dynamicRoutesTestSet,
        i18nTestSet,
        infiniteLoopTestSet,
        middlewareTestSet,
        trailingSlashTestSet,
    ].forEach(testSet => {
        describe(testSet.name, () => runTestSet(testSet));
    });
});
