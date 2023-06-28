import { describe, test } from 'mocha';
import { expect } from 'chai';
import {
    applyHeaders,
    applySearchParams,
    createRouteRequest,
    isUrl,
    parseAcceptLanguage,
} from '../../../dist/templates/handlers/nextjs/handler';

type MatchPCREResult = {
	match: RegExpMatchArray | null;
	captureGroupKeys: string[];
};

describe('applyHeaders', () => {
    test('applies headers from normal object', () => {
        const headers = new Headers({ foo: 'bar' });
        applyHeaders(headers, { other: 'value' }, "");

        expect(Object.fromEntries(headers.entries())).to.deep.equal({
            foo: 'bar',
            other: 'value',
        });
    });

    test('applies headers from headers object', () => {
        const headers = new Headers({ foo: 'bar' });
        applyHeaders(headers, new Headers({ other: 'value' }), "");

        expect(Object.fromEntries(headers.entries())).to.deep.equal({
            foo: 'bar',
            other: 'value',
        });
    });

    test('applies headers from object with pcre match', () => {
        const headers = new Headers({ foo: 'bar' });
        const pcreMatch: MatchPCREResult = {
            match: ['localhost/index.html', 'index.html'],
            captureGroupKeys: ['path'],
        };
        applyHeaders(headers, { other: 'path/to/$path' }, pcreMatch);

        expect(Object.fromEntries(headers.entries())).to.deep.equal({
            foo: 'bar',
            other: 'path/to/index.html',
        });
    });

    test.skip('appends `set-cookie` headers instead of overriding', () => {
        const headers = new Headers({ 'set-cookie': 'first-value' });
				// @ts-ignore
        applyHeaders(headers, { 'set-cookie': 'second-value' });
        expect([...headers.entries()]).to.deep.equal([
					[ 'set-cookie', 'first-value, second-value' ]
        ]);
    });
});

describe('isUrl', () => {
    test('returns true for valid url', () => {
        expect(isUrl('https://test.com')).to.equal(true);
    });

    test('returns false for invalid url', () => {
        expect(isUrl('test.com')).to.equal(false);
    });
});

describe('applySearchParams', () => {
    test('merges search params onto target', () => {
        const source = new URL('http://localhost/page?foo=bar');
        const target = new URL('http://localhost/page?other=value');

        expect([...source.searchParams.entries()].length).to.deep.equal(1);
        expect([...target.searchParams.entries()].length).to.deep.equal(1);

        applySearchParams(target.searchParams, source.searchParams);

        expect([...source.searchParams.entries()].length).to.deep.equal(1);
        expect([...target.searchParams.entries()].length).to.deep.equal(2);

        expect(target.toString()).to.deep.equal(
            'http://localhost/page?other=value&foo=bar'
        );
    });
});

describe('createRouteRequest', () => {
    test('creates new request with the new path', () => {
        const prevReq = new Request('http://localhost/test');
        const request = createRouteRequest(prevReq, '/new-path');

        expect(new URL(request.url).pathname).to.be.equal('/new-path');
    });
});

describe('parseAcceptLanguage', () => {
    test('extract the locales and sort by quality when present', () => {
        [
            { header: '', expected: [] },
            { header: 'en', expected: ['en'] },
            { header: 'en-US,en', expected: ['en-US', 'en'] },
            { header: 'en-US,en;q=0.9,es;q=0.8', expected: ['en-US', 'en', 'es'] },
            {
                header: 'en-US,fr;q=0.7,en;q=0.9,es;q=0.8',
                expected: ['en-US', 'en', 'es', 'fr'],
            },
            {
                header: 'fr;q=0.7,en;q=0.9,en-US,es;q=0.8',
                expected: ['en-US', 'en', 'es', 'fr'],
            },
            {
                header: 'fr;q = 0.7,en;q =0.9,en-US,es;q= 0.8',
                expected: ['en-US', 'en', 'es', 'fr'],
            },
        ].forEach(({ header, expected }) => {
            const result = parseAcceptLanguage(header);
            expect(result).to.deep.equal(expected);
        });
    });
});
