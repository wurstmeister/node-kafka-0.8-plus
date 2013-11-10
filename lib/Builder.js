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
        bufferMaker = build(value, bufferMaker);
        return bufferMaker.make();
    };


    var isAbsent = function(value) {
        return typeof value === 'undefined' || value === null;
    }

    var buildMessageBuffer = function (messageObject) {
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

    var buildMessageSet = function (messages) {
        var messageSetsBufferMaker = new BufferMaker();
        for (var message = 0; message < messages.length; message++) {
            var messageObject = {
                magicByte: 0,
                attributes: 0,
                key: messages[message].key,
                value: messages[message].value
            };
            var messageBodyBuffer = buildMessageBuffer(messageObject);
            var messageSize = messageBodyBuffer.length;
            var offset = -1;
            var int64Offset = new Int64(offset);
            messageSetsBufferMaker.string(int64Offset.buffer).Int32BE(messageSize).string(messageBodyBuffer)
        }

        return messageSetsBufferMaker.make();
    }

    var build = function (value, body, name) {
        var buffer = body;
        if (name === 'messages') {
            var messageSetBuffer = buildMessageSet(value);
            buffer = body.Int32BE(messageSetBuffer.length).string(messageSetBuffer);
        } else {
            var type = typeof (value);
            if (type === 'number' && name) {
                type = schema[name];
                if (!type) {
                    throw new Error('type of "' + name + '" is undefined');
                }
            }
            if (type === 'int16') {
                buffer = body.Int16BE(value);
            } else if (type === 'int32') {
                buffer = body.Int32BE(value);
            } else if (type === 'int64') {
                var int64 = new Int64(value);
                buffer = body.string(int64.buffer);
            } else if (type === 'string') {
                buffer = body.Int16BE(value.length)
                    .string(value);
            } else if (value instanceof Array) {
                var numElements = value.length;
                buffer = body.Int32BE(numElements);
                for (var i = 0; i < numElements; i++) {
                    var arrayElement = value[i];
                    buffer = build(arrayElement, body, name)
                }
            } else if (value instanceof Object) {
                for (var element in value) {
                    var elementValue = value[element];
                    buffer = build(elementValue, body, element)
                }
            }
        }
        return buffer;
    }

}
module.exports = Builder;