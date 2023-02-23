import { Versions } from "./versions/versions";
import { InvalidVersion } from "./errors/errors";

export class NodeChecker{

    public static check():boolean{
        const local_version = `${process.versions.node.split('.')[0]}.XX.X`;

        if ( (<any>Object).values(Versions).includes(local_version) ){
            return true;

        }else{
            throw new InvalidVersion(
                `Azion Framework Adapter requires at least node.js v${Object.values(Versions).toString()}.
You are using v${local_version}. Please update your version of node.js.`
            );
        }
    }
}