import * as chai from 'chai';

import {	
    addLeadingSlash,
	formatRoutePath,
	stripFuncExtension,
	stripIndexRoute,
	stripRouteGroups 
} from '../../../dist/utils/routing';

const { expect } = chai;

describe('routing', () => {
	it('stripRouteGroups', () => {
		expect(stripRouteGroups('/path/name')).to.equal('/path/name');
		expect(stripRouteGroups('/path/(route-group)/name')).to.equal('/path/name');
		expect(stripRouteGroups('/(route-group)/path')).to.equal('/path');
	});

	it('stripIndexRoute', () => {
		expect(stripIndexRoute('/index')).to.equal('/');
		expect(stripIndexRoute('/path/index')).to.equal('/path');
		expect(stripIndexRoute('/path')).to.equal('/path');
	});

	it('addLeadingSlash', () => {
		expect(addLeadingSlash('path')).to.equal('/path');
		expect(addLeadingSlash('/path')).to.equal('/path');
	});

	it('stripFuncExtension', () => {
		expect(stripFuncExtension('path')).to.equal('path');
		expect(stripFuncExtension('path.func')).to.equal('path');
		expect(stripFuncExtension('path/name.func')).to.equal('path/name');
	});

	it('formatRoutePath', () => {
		expect(formatRoutePath('\\path')).to.equal('/path');
		expect(formatRoutePath('path')).to.equal('/path');
		expect(formatRoutePath('/(group)/path')).to.equal('/path');
		expect(formatRoutePath('/path.func')).to.equal('/path');
	});
});


