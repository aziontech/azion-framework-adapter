import { InvalidNextJsVersion } from  "../../../../../dist/utils/version-checker/nextjs-checker/errors/errors";
import { NextJsChecker} from "../../../../../dist/utils/version-checker/nextjs-checker/nextjs-checker";
import { expect } from "chai";

// eslint-disable-next-line prefer-const
let package_mock = {
    dependencies: {
        ms: '2.1.3',
        next: '12.2.1',
        react: '^18.1.0',
        'react-dom': '^18.1.0'
    }
}

describe("nextjs checker",()=>{
    it(" Should call check method with success",()=>{
        expect(NextJsChecker.check(package_mock)).equal(true);
    });

    it(" Should return a InvalidNextjsVersion error instance if a latest version have been setted",()=>{
        package_mock.dependencies.next = "latest";
        try{
            NextJsChecker.check(package_mock)
        }catch(error){
            expect(error).instanceOf(InvalidNextJsVersion);
        }
    });

    it(" Should return a InvalidNextjsVersion error instance if a different version of 12.XX have been setted",()=>{
        package_mock.dependencies.next = "13.0.1";
        try{
            NextJsChecker.check(package_mock)
        }catch(error){
            expect(error).instanceOf(InvalidNextJsVersion);
        }
    });

    it(" Should return a InvalidNextjsVersion error instance if a canary version have been setted",()=>{
        package_mock.dependencies.next = "12.3.2-canary.0";
        try{
            NextJsChecker.check(package_mock)
        }catch(error){
            expect(error).instanceOf(InvalidNextJsVersion);
        }
    });

});