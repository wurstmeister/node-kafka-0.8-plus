var KafkaConnector = require('./KafkaConnector');
var Schema = require('./Schema');

var schema = new Schema().schema;

function LowLevelConsumer(broker, connectionCallback) {

    var connector = new KafkaConnector(broker, connectionCallback);

    this.fetch = function (topicRequest, callback) {
        var fetchMessage = {
            replicaId: -1,
            maxWaitTime: 200,
            minBytes: 640000,
            topics: topicRequest
        };
        connector.sendRequest(1, fetchMessage, schema.fetchResponse, callback);
    };

    this.getOffsets = function (offsetRequest, callback) {
        var offsetRequest = {
            replicaId: -1,
            topics: offsetRequest
        };
        connector.sendRequest(2, offsetRequest, schema.offsetResponse, callback);
    }

    this.getTopicMetadata = function (topics, callback) {
        connector.sendRequest(3, topics, schema.metaDataResponse, callback)
    };



    this.close = function() {
        connector.close();
    }
}

module.exports = LowLevelConsumer;
