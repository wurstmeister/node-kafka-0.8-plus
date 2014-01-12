var binary = require('binary');
var buffercrc32 = require('buffer-crc32');
var Schema = require('./Schema');
var KafkaError = require('./KafkaError');
var StringDeserializer = require('./StringDeserializer');

function Parser(schema) {

    var that = this;

    function checkCrc(messageBodyAndRemainder) {
        var vars = binary.parse(messageBodyAndRemainder.value).word32bs('crc').buffer('body', messageBodyAndRemainder.value.length - 4).vars;
        var messageBodyForCrc = vars.body;
        var crc = vars.crc;
        var calculatedCrc = buffercrc32.signed(messageBodyForCrc);
        if (calculatedCrc !== crc) {
            throw new Error('message corrupt (crc mismatch)')
        }
    }

    this.deserializer = new StringDeserializer();

    if ( schema ) {
        this.schema = schema;
    } else {
        this.schema = new Schema().schema;
    }

    this.int8 = function (buffer) {
        return binary.parse(buffer)
            .word8bs('value').buffer('remainder', buffer.length - 1)
            .vars;
    };

    this.int16 = function (buffer) {
        return binary.parse(buffer)
            .word16bs('value').buffer('remainder', buffer.length - 2)
            .vars;
    };

    this.int32 = function (buffer) {
        return binary.parse(buffer)
            .word32bs('value').buffer('remainder', buffer.length - 4)
            .vars;
    };

    this.int64 = function (buffer) {
        return binary.parse(buffer)
            .word64bs('value').buffer('remainder', buffer.length - 8)
            .vars;
    };

    this.string = function (buffer) {
        var stringLength = binary.parse(buffer).word16bs('stringLength').vars.stringLength;
        var result = binary.parse(buffer).word16bs('stringLength').buffer('string', stringLength).buffer('remainder', buffer.length - 2 - stringLength).vars;
        return {
            value: result.string.toString('utf8', 0, stringLength),
            remainder: result.remainder
        }
    };

    this.arrayData = function (buffer) {
        return binary.parse(buffer)
            .word32bs('numElements').buffer('arrayBody', buffer.length - 4)// num of elements in the array
            .vars;
    };

    function needToLookupItemType(itemType) {
        return typeof(itemType) === 'string' && itemType.indexOf('int') !== 0;
    }

    function shouldCreateByteBuffer(itemType) {
        return itemType === 'bytes';
    }

    this.array = function(buffer, type) {
        var result = {};
        var elements = [];
        var itemType = type[0];
        var arrayBodyAndLength = that.arrayData(buffer);
        var body = arrayBodyAndLength.arrayBody;
        if (arrayBodyAndLength.numElements > -1 ) {
            if (shouldCreateByteBuffer(itemType)) {
                result = that.bytes(body, arrayBodyAndLength.numElements);
            } else {
                if (needToLookupItemType(itemType) ) {
                    itemType = that.schema[type];
                }
                for (var element = 0; element < arrayBodyAndLength.numElements; element++) {
                    var result = that.read(body, itemType);
                    body = result.remainder;
                    var arrayElement = result.value;
                    elements.push(arrayElement);
                }
                result.value = elements;
                result.remainder = body;
            }
        } else {
            result.value = null;
            result.remainder = body;
        }
        return result;
    };

    this.object = function(buffer, type) {
        var result = {};
        var complexType = {};
        if (typeof type === 'string') {
            throw new Error('invalid argument "' + type + '"')
        }
        if (!type) {
            throw new Error('type "' + type + '" is not registered in current schema')
        }
        for (var key in  type) {
            var valueAndRemainder = that.read(buffer, type[key]);
            complexType[key] = valueAndRemainder.value;
            buffer = valueAndRemainder.remainder;
            if ('messageSetSize' === key && valueAndRemainder.value > 0) {
                var readMessageSet = that.messageSet(buffer, valueAndRemainder.value);
                complexType['messageSet'] = readMessageSet.value;
                buffer = readMessageSet.remainder;
            } else if ( 'errorCode' === key ) {
                if (valueAndRemainder.value !== 0) {
                    throw new KafkaError(valueAndRemainder.value);
                }
            }
        }
        result.value = complexType;
        result.remainder = buffer;
        return result;
    };

    this.messageSet = function (buffer, sizeInBytes) {
        var messages = [];
        while (sizeInBytes > 0) {
            var offsetAndRemainder = this.read(buffer, 'int64');
            sizeInBytes = sizeInBytes - 8;
            var messageSizeAndRemainder = this.read(offsetAndRemainder.remainder, 'int32');
            sizeInBytes = sizeInBytes - 4;
            sizeInBytes = sizeInBytes - messageSizeAndRemainder.value;
            var messageBodyAndRemainder = this.bytes(messageSizeAndRemainder.remainder, messageSizeAndRemainder.value);
            checkCrc(messageBodyAndRemainder);
            var message = this.read(messageBodyAndRemainder.value, this.schema.message).value;
            message.key = this.deserializer.deserialize(message.key);
            message.value = this.deserializer.deserialize(message.value);
            messages.push(message);
            buffer = messageBodyAndRemainder.remainder;
        }
        return {
            value: messages,
            remainder : buffer
        };
    };

    this.bytes = function (buffer, messageSize) {
        var result = binary.parse(buffer).buffer('message', messageSize).buffer('remainder', buffer.length - messageSize).vars;
        return {
            value: result.message,
            remainder: result.remainder
        };
    };

    this.buildParseFunction = function(type) {
        if  (typeof type === 'string')  {
            return this[type];
        } else if (type instanceof Array) {
            return this.array;
        } else {
            return this.object;
        }
    };

    this.read = function (buffer, type) {
        var parseFunction = this.buildParseFunction(type);
        return parseFunction(buffer, type);
    };

    this.parse = function(buffer, type) {
        return this.read(buffer, type).value
    };
}

module.exports = Parser;