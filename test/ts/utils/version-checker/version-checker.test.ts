import { VersionChecker } from "../../../../dist/utils/version-checker/version-checker";
import { expect } from "chai";

describe("Version Checker test suite",()=>{

    it("should verify if node_version method was called with success",()=>{
        expect(VersionChecker.node_version()).equal(true);
    });

    it("should verify if nextjs_version was called with success",()=>{
        expect(VersionChecker.nextjs_version(`${process.cwd()}/test/mocks`)).equal(true);
    });

});

