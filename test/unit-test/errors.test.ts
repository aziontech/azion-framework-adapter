
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

import * as errors from '../../dist/errors';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);


describe('errors', () => {
    describe('error classes', () => {

        function class_name_and_error_matching(error: errors.BaseError): boolean {
            return errors.ErrorCode[error.constructor.name as keyof typeof errors.ErrorCode] === error.errorCode;
        }

        it('test constructors and error code matching', () => {

            // tslint:disable:no-unused-expression
            class_name_and_error_matching(new errors.CannotCloneTemplate('dir1', 'reason1')).should.be.true;
            class_name_and_error_matching(new errors.DirectoryNotEmpty('dir3')).should.be.true;
            class_name_and_error_matching(new errors.NotADirectory('dir4')).should.be.true;
            class_name_and_error_matching(new errors.CannotRenameTemplateProject('dir5', 'reason5')).should.be.true;
            class_name_and_error_matching(new errors.FailedToBuild('dir6', 'reason6')).should.be.true;
            class_name_and_error_matching(new errors.S3CredentialsNotSet()).should.be.true;
            class_name_and_error_matching(new errors.AzionCredentialsNotSet()).should.be.true;
            class_name_and_error_matching(new errors.NotAValidFile('file1', 'reason7')).should.be.true;
            class_name_and_error_matching(new errors.FileNotFound('file2')).should.be.true;
            class_name_and_error_matching(new errors.CannotSaveFunction('message1')).should.be.true;

        });
    });

    describe('display errors and exit codes', () => {

        let sandbox: ChaiSpies.Sandbox;

        beforeEach(() => {
            sandbox = chai.spy.sandbox();
            sandbox.on(console, 'log', () => { /*Do nothing.*/ });
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('string errors should display itself', () => {
            errors.displayError("I don't know this type of error.");
            console.log.should.have.been.called.once.with("I don't know this type of error.");
        });


        it('errors of type Error() should display the message field', () => {
            errors.displayError(new Error("This is a traditional Error()"));
            console.log.should.have.been.called.once.with("This is a traditional Error()");
        });

        it('errors of type BaseError() should display message field', () => {
            errors.displayError(new errors.CannotSaveFunction("message1"));
            errors.displayError(new errors.NotAValidFile('file1', 'reason7'));
            console.log.should.have.been.called.
                with("Cannot save edge function to Azion: message1").and.
                with("Couldn't read file 'file1' at the project's root directory. Because reason7");
        });

        it('string errors should have ErrorCode.Unknown', () => {
            errors.errorCode("I don't know this type of error.").should.be.equal(errors.ErrorCode.Unknown);
        });


        it('errors of type Error() have ErrorCode.Unknown', () => {
            errors.errorCode(new Error("This is a traditional Error()")).should.be.equal(errors.ErrorCode.Unknown);
        });

        it('errors of type BaseError() have one individual error codes', () => {
            errors.errorCode(new errors.CannotSaveFunction("message1")).should.be.equal(errors.ErrorCode.CannotSaveFunction);
            errors.errorCode(new errors.NotAValidFile('file1', 'reason7')).should.be.equal(errors.ErrorCode.NotAValidFile);
        });


    });

});
