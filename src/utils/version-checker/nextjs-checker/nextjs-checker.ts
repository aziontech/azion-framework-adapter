import { NextJsVersions } from "./versions/versions";
import { InvalidNexJsVersion } from "./errors/errors";


export class NextJsChecker{

    //this method receives a parsed package.json as a parameter
    public static check(package_json_content:any):boolean{

        const next_version = package_json_content.dependencies.next;

        if( next_version.includes("canary") ){
            throw new InvalidNexJsVersion(
                `Azion Framework Adapter does not offers support to nextjs canary versions and requires Nextjs v: ${Object.values(NextJsVersions).toString()}.
                You are using version: ${next_version}. Please try to update your Nextjs version.`
            );
        }
        
        const version_value = next_version.split(".")[0].replace("^","");
        const formated_version =  version_value == "latest" ? version_value:`${version_value}.XX.X`;

        if ( (<any>Object).values(NextJsVersions).includes(formated_version) ){
            return true;

        }else{

            throw new InvalidNexJsVersion(
                `Azion Framework Adapter requires at least Nextjs v${Object.values(NextJsVersions).toString()}.
You are using v:${formated_version}. Please try to update your version of Nextjs.`
            );
        }
    }
}