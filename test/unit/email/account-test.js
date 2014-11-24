'use strict';

var Account = require('../../../src/js/email/account'),
    appConfig = require('../../../src/js/app-config'),
    Auth = require('../../../src/js/service/auth'),
    DeviceStorageDAO = require('../../../src/js/service/devicestorage'),
    Email = require('../../../src/js/email/email'),
    Outbox = require('../../../src/js/email/outbox'),
    Keychain = require('../../../src/js/service/keychain'),
    UpdateHandler = require('../../../src/js/util/update/update-handler');

describe('Account Service unit test', function() {
    var account, authStub, outboxStub, emailStub, devicestorageStub, keychainStub, updateHandlerStub, pgpbuilderStub,
        realname = 'John Doe',
        dummyUser = 'spiderpig@springfield.com';

    chai.config.includeStack = true;

    beforeEach(function() {
        authStub = sinon.createStubInstance(Auth);
        outboxStub = sinon.createStubInstance(Outbox);
        devicestorageStub = sinon.createStubInstance(DeviceStorageDAO);
        emailStub = sinon.createStubInstance(Email);
        outboxStub = sinon.createStubInstance(Outbox);
        keychainStub = sinon.createStubInstance(Keychain);
        updateHandlerStub = sinon.createStubInstance(UpdateHandler);
        pgpbuilderStub = {};
        account = new Account(appConfig, authStub, devicestorageStub, emailStub, outboxStub, keychainStub, updateHandlerStub, pgpbuilderStub);
    });

    afterEach(function() {});

    describe('isLoggedIn', function() {
        it('should be logged in', function() {
            account._accounts = [{}];
            expect(account.isLoggedIn()).to.be.true;
        });
        it('should not be logged in', function() {
            account._accounts = [];
            expect(account.isLoggedIn()).to.be.false;
        });
    });

    describe('list', function() {
        it('should work', function() {
            var testAccounts = [{
                foo: 'bar'
            }];
            account._accounts = testAccounts;
            expect(account.list()).to.deep.equal(testAccounts);
        });
    });

    describe('init', function() {
        it('should fail for invalid email address', function() {
            account.init({
                emailAddress: dummyUser.replace('@'),
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err).to.exist;
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _accountStore.init', function() {
            devicestorageStub.init.throws(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/asdf/);
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _updateHandler.update', function() {
            updateHandlerStub.update.yields(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/Updating/);
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _keychain.getUserKeyPair', function() {
            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/asdf/);
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _keychain.refreshKeyForUserId', function() {
            var storedKeys = {
                publicKey: 'publicKey'
            };

            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(null, storedKeys);
            keychainStub.refreshKeyForUserId.yields(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/asdf/);
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _emailDao.init after _keychain.refreshKeyForUserId', function() {
            var storedKeys = {
                publicKey: 'publicKey'
            };

            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(null, storedKeys);
            keychainStub.refreshKeyForUserId.yields(null, storedKeys);
            emailStub.init.yields(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/asdf/);
                expect(keys).to.not.exist;
            }
        });

        it('should fail for _emailDao.init', function() {
            var storedKeys = {
                publicKey: 'publicKey',
                privateKey: 'privateKey'
            };

            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(null, storedKeys);
            emailStub.init.yields(new Error('asdf'));

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err.message).to.match(/asdf/);
                expect(keys).to.not.exist;
            }
        });

        it('should work after _keychain.refreshKeyForUserId', function() {
            var storedKeys = {
                publicKey: 'publicKey'
            };

            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(null, storedKeys);
            keychainStub.refreshKeyForUserId.yields(null, 'publicKey');
            emailStub.init.yields();

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err).to.not.exist;
                expect(keys).to.deep.equal(storedKeys);
            }
        });

        it('should work', function() {
            var storedKeys = {
                publicKey: 'publicKey',
                privateKey: 'privateKey'
            };

            updateHandlerStub.update.yields();
            keychainStub.getUserKeyPair.yields(null, storedKeys);
            emailStub.init.yields();

            account.init({
                emailAddress: dummyUser,
                realname: realname
            }, onInit);

            function onInit(err, keys) {
                expect(err).to.not.exist;
                expect(keys).to.equal(storedKeys);
            }
        });
    });

});