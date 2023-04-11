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

## Build
```
azion-framework-adapter build --version-id vid
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

This project is licensed under the terms of the [MIT](LICENSE) license.
