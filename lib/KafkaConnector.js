var net = require('net');
var BufferMaker = require('buffermaker');
var Builder = require('./Builder');
var Parser = require('./Parser');
var Schema = require('./Schema');


var schema = new Schema().schema;
var builder = new Builder();
var parser = new Parser();

function KafkaConnector(broker, connectionCallback) {
    var that = this;
    if (!broker.port) {
        broker.port = 9092;
    }
    this.buffer = null;
    this.handlers = {};
    this.processingRequest = false;
    this.connected = false;
    this.correlationId = 1;

    client = net.connect(broker, function () {
        that.connected = true;
        if (connectionCallback) {
            connectionCallback();
        }
    });


    client.on('data', function (data) {
        if (that.buffer) {
            that.buffer = Buffer.concat([that.buffer , data]);
        } else {
            that.buffer = data;
        }
        var responseAndRemainder = parser.read(that.buffer, schema.response);
        var response = responseAndRemainder.value;
        var size = response.size;
        var correlationId = response.correlationId;
        // the size field is 4 bytes long
        var readAllData = size === that.buffer.length - 4;
        if (readAllData) {
            that.buffer = null;
            var responseType = that.handlers[correlationId].responseType;
            var responseBuffer = responseAndRemainder.remainder;
            var topics = parser.parse(responseBuffer, responseType);
            var callback = that.handlers[correlationId].handler;
            that.processingRequest = false;
            callback(topics);
            delete that.handlers[correlationId];
        }
    });


    client.on('end', function () {
        that.connected = false;
        console.log('client disconnected');
    });


    client.on('error', function (data) {
        console.log('closing connection because of error: ' + data.toString());
        that.close();
    });


    this.sendRequest = function (apiKey, requestBody, responseType, responseHandler) {
        if (!this.connected) {
            throw new Error('No connection to broker');
        }

        if (this.processingRequest === true) {
            console.log('request in progress, resubmitting');
            var delayedExecution = function () {
                that.sendRequest(apiKey, requestBody, responseType, responseHandler)
            };
            setTimeout(delayedExecution, 100);
        } else {
            var request = {
                apiKey: apiKey,
                apiVersion: 0,
                correlationId: this.correlationId,
                clientId: 'kafkaConnector',
                requestMessage: requestBody
            };
            this.correlationId = this.correlationId + 1;
            this.processingRequest = true;
            this.handlers[request.correlationId] = {
                handler: responseHandler,
                responseType: responseType
            };
            var requestMessage = builder.buildBuffer(request);
            var size = requestMessage.length;
            var req = new BufferMaker()
                .Int32BE(size + 2)
                .string(requestMessage).make();
            client.write(req);
            client.write('\r\n');
        }
    };


    this.close = function() {
        this.connected = false;
        if ( this.processingRequest ) {
            console.log('waiting for current request to finish')
            setTimeout(function() {
                close()}
                , 50 );
        }
        client.end();
    }


    this.stopProcessing = function () {
        this.processingRequest = false;
    }
}


module.exports = KafkaConnector;