import { NodeChecker } from "./node-checker/node-checker";

export class VersionChecker{

    public static node_version():boolean {
        return NodeChecker.check();
    }

}