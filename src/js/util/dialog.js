'use strict';

var ngModule = angular.module('woUtil');
ngModule.service('dialog', Dialog);
module.exports = Dialog;

function Dialog() {}

Dialog.prototype.error = function() {};

Dialog.prototype.info = function() {};

Dialog.prototype.confirm = function() {};