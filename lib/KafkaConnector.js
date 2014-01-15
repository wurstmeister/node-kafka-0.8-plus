var BufferMaker = require('buffermaker');
var Builder = require('./Builder');
var Parser = require('./Parser');
var Schema = require('./Schema');
var KafkaError = require('./KafkaError');

var net = require('net');
var bunyan = require('bunyan');

var schema = new Schema().schema;
var builder = new Builder();
var parser = new Parser();

var log = bunyan.createLogger({
    name: "kafka-connector",
    level: bunyan["DEBUG"]
});


function KafkaConnector(broker, connectionCallback) {
    var that = this;
    if (!broker.port) {
        broker.port = 9092;
    }
    this.buffer = null;
    this.handlers = [];
    this.processingRequest = false;
    this.currentRequest = null;
    this.connected = false;
    this.correlationId = 1;

    var client = net.connect(broker, function () {
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
            var currentHandler = that.handlers.shift();
            var responseBuffer = responseAndRemainder.remainder;
            that.processResponse(currentHandler, responseBuffer, correlationId);
        }
    });


    client.on('end', function () {
        that.connected = false;
        log.info('client disconnected');
    });


    client.on('error', function (data) {
        log.error('closing connection because of error: ' + data.toString());
        that.close();
    });


    this.sendRequest = function (apiKey, requestBody, responseType, responseHandler) {
        if (!this.connected) {
            throw new Error('No connection to broker');
        }

        if (this.processingRequest === true) {
            log.debug('request in progress, resubmitting');
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
            this.currentRequest = requestBody;
            this.handlers.push({
                handler: responseHandler,
                responseType: responseType
            });
            var requestMessage = builder.buildBuffer(request);
            var size = requestMessage.length;
            var req = new BufferMaker()
                .Int32BE(size + 2)
                .string(requestMessage).make();
            client.write(req);
            client.write('\r\n');
        }
    };


    this.processResponse = function (currentHandler, responseBuffer, correlationId) {
        try {
            var responseType = currentHandler.responseType;
            var callback = currentHandler.handler;
            var response = parser.parse(responseBuffer, responseType);
            callback(response);
        } catch (error) {
            log.error('Error while processing request: %j broker: %j error: %j', that.currentRequest, broker, error);
            if (error instanceof KafkaError) {
                throw new Error(error.error);
            } else {
                throw error;
            }
        } finally {
            that.stopProcessing();
            log.debug("finished processing correlationID " + correlationId);
        }
    };

    this.close = function () {
        this.connected = false;
        if (this.processingRequest) {
            log.debug('waiting for current request to finish')
            setTimeout(function () {
                    that.close();
                }
                , 50);
        }
        client.end();
    }


    this.stopProcessing = function () {
        this.processingRequest = false;
        this.currentRequest = null;
    }
}


module.exports = KafkaConnector;