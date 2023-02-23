import { InvalidVersion } from "../../../../../dist/utils/version-checker/node-checker/errors/errors";
import { NodeChecker } from "../../../../../dist/utils/version-checker/node-checker/node-checker";
import * as sinon from "sinon";
import { expect } from "chai";

describe("Node checker test suite",()=>{
    it("Call check method",()=>{
        expect(NodeChecker.check()).equal(true);
    });

    it("Should return a InvalidVersion error instance if a invalid node version have been setted",()=>{
        const stub = sinon.stub(process.versions, "node").value("1.2.3");
        try{
            NodeChecker.check()
        }catch(error){
            expect(error).instanceof(InvalidVersion);
            stub.restore();
        }
    });
});