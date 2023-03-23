# Azion Framework Adapter

Azion Framework Adapter is a command line tool that builds Jamstack projects targeting Azion's Edge Functions.

## Quick links
* [Prerequisites](#Prerequisites)
* [Install](#Install)
* [Usage](#Usage)
* [Build](#Build)
* [Publish](#Publish)
* [Notes](#Notes)
* [License](#License)
* [Contributing](CONTRIBUTING.md)
* [Code of Conduct](CODE_OF_CONDUCT.md)
* [Individual Contributor License Agreement (CLA)](CLA.md)

## Prerequisites
* Node version >= 16.

## Install

### From npm
```
npm install -g azion-framework-adapter
```
You must have permission to install global packages with npm in your operating system. If you are having problems installing the package globally check [Resolving EACCES permissions errors when installing packages globally](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

### From source
```
  git clone git@github.com:aziontech/azion-framework-adapter.git
  cd azion-framework-adapter
  npm install
  npm run build
  npm install -g --production
```

## Usage
After install it globally in your machine, run:
```
azion-framework-adapter COMMAND
```
You can use the package without installing it, just run:
```
npx azion-framework-adapter COMMAND
```

### Using the template
Static site example:
```
git clone https://github.com/aziontech/cells-site-template
```

## Build

You will need a bucket in AWS S3, its access key and its secret access key. You can set the credentials at the `azion.json` file inside the project or define the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

You can alternatively enter the bucket data in the `environment variables`:

```
AWS_DEFAULT_BUCKET_NAME=bucket-name
AWS_DEFAULT_BUCKET_REGION=sa-east-1
AWS_DEFAULT_BUCKET_PATH=path
```

The access credentials to the bucket will be stored in the code sent to Azion and the Edge Function will use them to retrieve the necessary pages stored during the publish step.
Similarly, you will need a [Personal Token](https://www.azion.com/pt-br/documentacao/produtos/gestao-de-contas/personal-tokens) to deploy your project at Azion and you can either set those in the `azion.json` file or define the environment variable `AZION_TOKEN`. The Azion credentials are not stored in the built code.

> Values from the `azion.json` file will be prioritized over environment variables if populated.
### Build steps
```
  cd ./PROJECT_NAME
  npm install
  azion-framework-adapter build
  cat > ./azion.json << EOF
  {
    "kv": {
      "accessKeyId": "<AWS_ACCESS_KEY_ID>",
      "secretAccessKey": "<AWS_SECRET_ACCESS_KEY>",
      "bucket": "<AWS_DEFAULT_BUCKET_NAME>",
      "region": "<AWS_DEFAULT_BUCKET_REGION>",
      "path": "<AWS_DEFAULT_BUCKET_PATH>"
    },
    "azion": {
      "token": "<AZION_TOKEN>",
      "function_name": "my-function-name"
    }
  }
  EOF
```

## Publish
```
azion-framework-adapter publish
```

### Azion Edge Application

After building and publishing your code to Azion, you should login into Azion's Real Time Manager and create an Edge Application that will make use of your recently published Edge Function. Subsequent builds followed by corresponding publishes will automatically update your Edge Application.

## Notes
* We strongly recommend to use [azion-cli](https://github.com/aziontech/azion-cli) for a better developer experience.

## License

This project is licensed under the terms of the [MIT](LICENSE) license.a
