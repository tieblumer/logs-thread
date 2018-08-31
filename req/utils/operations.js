module.exports = { push, pull, min, max, first, last, minIndex, maxIndex, sum, merge };

const mergeObjects = require("../../utils/merge").mergeObjects;

function push(values) {
	const list = flat(values);
	const result = [];
	list.forEach(item => {
		if (result.indexOf(item) === -1) {
			result.push(item);
		}
	});
	return result;
}

function pull(values) {
	return push(values).reverse();
}

function min(values) {
	const list = flat(values);
	return Math.min.apply(null, list);
}

function max(values) {
	const list = flat(values);
	return Math.max.apply(null, list);
}

function first(values) {
	const list = flat(values);
	return list.find(v => v !== undefined && v !== null);
}

function last(values) {
	const list = flat(values);
	return list.reverse().find(v => v !== undefined && v !== null);
}

function minIndex(values, reference) {
	const list = flat(values);
	const indexes = list.map(v => reference.indexOf(v)).filter(index => index > -1);
	const index = Math.min.apply(undefined, indexes);
	return reference[index];
}

function maxIndex(values, reference) {
	const list = flat(values);
	const indexes = list.map(v => reference.indexOf(v));
	const index = Math.max.apply(undefined, indexes);
	return reference[index];
}

function sum(values) {
	const list = flat(values);
	return list.reduce((lastValue, currentValue) => lastValue + currentValue);
}

function merge(values) {
	const list = flat(values);
	const value = {};
	list.forEach(item => mergeObjects(item, value));
	return value;
}

function flat(listArray) {
	const array = [];
	listArray.forEach(item => {
		if (Array.isArray(item)) {
			array.push.apply(array, item);
		} else {
			array.push(item);
		}
	});
	return array.filter(item => item !== undefined);
}
