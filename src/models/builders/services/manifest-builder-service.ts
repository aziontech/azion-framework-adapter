import ManifestBuilder from "../../../manifest";

export class ManifestBuilderService{
    manifestbuilder = ManifestBuilder;

    assetsPaths(assetsDir: string): Array<string>{
        try{
            return this.manifestbuilder.assetsPaths(assetsDir);
        }catch(error: any){
            throw new Error('Manifest builder error');
        }
    }
}