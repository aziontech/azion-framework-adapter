import { VersionChecker } from "../../../../dist/utils/version-checker/version-checker";
import { InvalidProject } from "../../../../dist/utils/version-checker/errors/errors";
import { assert, expect } from "chai";
import * as sinon from "sinon";

describe("Version Checker test suite",()=>{

    it("Should verify if node_version method was called",()=>{
        const spy = sinon.spy(VersionChecker,"node_version");
        VersionChecker.node_version();
        assert(spy.calledOnce);

    });

    it("should verify if node_version method was called with success",()=>{
        const stub = sinon.stub(process.versions, "node").value("18.16.1");
        expect(VersionChecker.node_version()).equal(true);
        stub.restore();
    });

    it("should verify if nextjs_version was called with success",()=>{
        const versionCheckerStub = sinon.stub(VersionChecker,"nextjs_version").callsFake(() => {
            return true
        });
        const arg = "/fake/path";
        VersionChecker.nextjs_version(arg);
        assert(versionCheckerStub.withArgs(arg).calledOnce);
        versionCheckerStub.restore();
    });

    it("Should ensure that it will break if a the next version checker was called from a non project directory",()=>{
        try{
            VersionChecker.nextjs_version("./");
        }catch(error){
            expect(error).instanceof(InvalidProject);
        }
    });

});

