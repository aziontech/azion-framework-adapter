import { NodeChecker } from "../../../../../dist/utils/version-checker/node-checker/node-checker";
import { expect } from "chai";


describe("Node checker test suite",()=>{
    it("Call check method",()=>{
        expect(NodeChecker.check()).equal(true);
    })
});