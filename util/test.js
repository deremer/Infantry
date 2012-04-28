var _u = require('./underscore-extended');

console.log(_u.isNotEmptyString('hello'));
console.log(_u.isNotEmptyString(''));
console.log(_u.isNotEmptyString());
console.log(_u.isNotEmptyString(null));
console.log(_u.isNotEmptyString([]));
console.log(_u.isNotEmptyString({'hello':'world}));
console.log(_u.isNotEmptyString(123));