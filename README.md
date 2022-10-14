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
* Node version >= 14.

## Install

### From source
```
  git clone git@github.com:aziontech/azion-framework-adapter.git
  cd azion-framework-adapter
  npm install
  npm run build
  npm install -g --production
```

## Usage

### Using the template
Static site example:
```
git clone https://github.com/aziontech/cells-site-template
```

## Build

You will need a bucket in AWS S3, its access key and its secret access key. You can set the credentials at the `azion.json` file inside the project or define the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The access credentials to the bucket will be stored in the code sent to Azion and the Edge Function will use them to retrieve the necessary pages stored during the publish step.
Similarly, you will need credentials to deploy your project at Azion and you can either set those in the `azion.json` file or define the environment variable `AZION_TOKEN`. The Azion credentials are not stored in the built code.

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
      "bucket": "my-bucket-name",
      "region": "us-east-1",
      "path": "__static_content"
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

## Tests

### Unit tests
```
npm run test
```

### E2E tests

Before run e2e test you need initialize the Verdaccio and LocalStack containners to emulate npm registry and AWS S3 Bucket
```
docker-compose up
```
Access http://0.0.0.0:4873 and folow the instructions.
```
npm run e2e
```

## Notes
* We strongly recommend to use [azion-cli](https://github.com/aziontech/azion-cli) for a better developer experience.

## License

This project is licensed under the terms of the [MIT](LICENSE) license.