var KafkaConnector = require('./KafkaConnector');
var Schema = require('./Schema');

var schema = new Schema().schema;



function Producer(broker, connectionCallback) {

    var connector = new KafkaConnector(broker, connectionCallback);

    this.produce = function (produceRequest, callback) {
        connector.sendRequest(0, produceRequest, schema.produceResponse, callback);
        if ( produceRequest.requiredAcks === 0) {
            connector.stopProcessing();
        }
    }

    this.close = function() {
        connector.close();
    }
}

module.exports=Producer
