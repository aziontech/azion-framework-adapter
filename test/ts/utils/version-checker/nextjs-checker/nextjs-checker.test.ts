import { NextJsChecker} from "../../../../../dist/utils/version-checker/nextjs-checker/nextjs-checker";
import { expect } from "chai";


describe("nextjs checker",()=>{
    it(" Should call check method with success",()=>{
        const package_mock = {
            scripts: {
                dev: 'yarn next dev',
                build: 'yarn next build',
                start: 'yarn next start'
            },
            dependencies: {
                ms: '2.1.3',
                next: '12.2.1',
                react: '^18.1.0',
                'react-dom': '^18.1.0'
            },
            devDependencies: {
                '@netlify/build': '^27.20.6',
                '@netlify/functions': '^1.3.0',
                '@netlify/plugin-nextjs': '^4.24.3',
                '@types/fs-extra': '^9.0.13',
                'fs-extra': '^10.0.1',
                vercel: '^28.4.17'
            }
        }
        expect(NextJsChecker.check(package_mock)).equal(true);
    })
});