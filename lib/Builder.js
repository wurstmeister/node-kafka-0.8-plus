var BufferMaker = require('buffermaker');
var Int64 = require('node-int64');
var buffercrc32 = require('buffer-crc32');


var schema = {
    partitionId: 'int32',
    fetchOffset: 'int64',
    maxBytes: 'int32',
    apiKey: 'int16',
    apiVersion: 'int16',
    correlationId: 'int32',
    replicaId: 'int32',
    maxWaitTime: 'int32',
    minBytes: 'int32',
    time: 'int64',
    maxNumberOfOffsets: 'int32',
    requiredAcks: 'int16',
    timeout: 'int32',
    magicByte: 'int8',
    attributes: 'int8'
};


function Builder() {
    var that = this;

    this.buildBuffer = function (value) {
        var bufferMaker = new BufferMaker();
        bufferMaker = this.build(value, bufferMaker);
        return bufferMaker.make();
    };

    var isAbsent = function(value) {
        return typeof value === 'undefined' || value === null;
    }

    this.messageBuffer = function (messageObject) {
        var messageBufferMaker = new BufferMaker();
        messageBufferMaker = messageBufferMaker.Int8(messageObject.magicByte).Int8(messageObject.attributes);
        if (isAbsent(messageObject.key)) {
            messageBufferMaker = messageBufferMaker.Int32BE(-1);
        } else {
            messageBufferMaker = messageBufferMaker.Int32BE(messageObject.key.length).string(messageObject.key);
        }
        if (isAbsent(messageObject.value)) {
            throw new Error('You have to specify a message');
        } else {
            messageBufferMaker = messageBufferMaker.Int32BE(messageObject.value.length).string(messageObject.value);
        }
        var messageBuffer = messageBufferMaker.make();
        var calculatedCrc = buffercrc32.signed(messageBuffer);
        messageBufferMaker = new BufferMaker();
        return messageBufferMaker.Int32BE(calculatedCrc).string(messageBuffer).make();
    }

    this.messageSet = function (messages) {
        var messageSetsBufferMaker = new BufferMaker();
        for (var message = 0; message < messages.length; message++) {
            var messageObject = {
                magicByte: 0,
                attributes: 0,
                key: messages[message].key,
                value: messages[message].value
            };
            var messageBodyBuffer = this.messageBuffer(messageObject);
            var messageSize = messageBodyBuffer.length;
            var offset = -1;
            var int64Offset = new Int64(offset);
            messageSetsBufferMaker.string(int64Offset.buffer).Int32BE(messageSize).string(messageBodyBuffer)
        }

        return messageSetsBufferMaker.make();
    }

    this.messages = function(value, body) {
        var messageSetBuffer = that.messageSet(value);
        return body.Int32BE(messageSetBuffer.length).string(messageSetBuffer);
    }


    this.int16 = function(value, body) {
        return body.Int16BE(value);
    }

    this.int32 = function(value, body) {
        return body.Int32BE(value);
    }

    this.int64 = function(value, body) {
        var int64 = new Int64(value);
        return body.string(int64.buffer);
    }

    this.string = function(value, body) {
        return body.Int16BE(value.length)
            .string(value);
    }

    this.array = function(value, body, name) {
        var numElements = value.length;
        var buffer = body.Int32BE(numElements);
        for (var i = 0; i < numElements; i++) {
            var arrayElement = value[i];
            buffer = that.build(arrayElement, body, name)
        }
        return buffer;
    }

    this.object = function(value, body) {
        var buffer = body;
        for (var element in value) {
            var elementValue = value[element];
            buffer = that.build(elementValue, body, element)
        }
        return buffer;
    }


    this.generateBuildFunction = function(value, body, name) {
        if (name === 'messages') {
            return this.messages;
        } else if (value instanceof Array) {
            return this.array
        } else {
            var type = typeof (value);
            if (type === 'number' && name) {
                type = schema[name];
                if (!type) {
                    throw new Error('type of "' + name + '" is undefined');
                }
            }
            return this[type];
        }
    };

    this.build = function (value, body, name) {
        var buildFunction = this.generateBuildFunction(value, body, name);
        return buildFunction(value, body, name);
    }

}
module.exports = Builder;