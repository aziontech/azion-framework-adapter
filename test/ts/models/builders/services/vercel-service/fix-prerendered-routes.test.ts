import * as chai from 'chai';
import * as fs from 'fs';

import type { PrerenderedFileData } from '../../../../../../dist/models/builders/services/types/vercel-service-types';
import { handlePrerenderedRoutes } from '../../../../../../dist/models/builders/services/vercel-service';

const { expect } = chai;

describe('fix-prerendered-routes', ()=>{

    afterEach(()=>{
        chai.spy.restore();
    });

	it('should call handlePrerenderedRoutes with success', async() => {
		
		const inputtedPrerendered = new Map<string, PrerenderedFileData>();
        chai.spy.on(fs,'readdirSync',()=>{
            return ['fake/path1','fake/path1'];
        });
        const error = await (async()=>{
            try{
                await handlePrerenderedRoutes(['fake/path'],inputtedPrerendered);
                return undefined;
            }catch(error:any){
                return error.message;
            }
        })();
		
		expect(error).to.equal(undefined);
	});
});

