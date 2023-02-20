import { NextJsChecker } from "./nextjs-checker/nextjs-checker";
import { NodeChecker } from "./node-checker/node-checker";
import * as fs from "fs";


export class VersionChecker{

    public static node_version():boolean {
        return NodeChecker.check();
    }

    public static nextjs_version(target_dir:string):boolean {
        
        const package_json = JSON.parse(
            fs.readFileSync(`${target_dir}/package.json`, "utf-8")
        );
        return NextJsChecker.check(package_json);
    }

}