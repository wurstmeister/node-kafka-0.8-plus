var Producer = require('../lib/Producer');
var Optimist = require('optimist');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
    name:"producer-test",
    level: bunyan["DEBUG"]
});


var argv = Optimist.usage('Usage: $0 --host [host] --port [port] --topic [topic]').
    default('port', 9092).
    default('host', 'localhost').
    default('topic', 'node-topic').argv;

log.info("Connecting to: " + argv.host + ":" + argv.port);

var producer = new Producer({host: argv.host, port: argv.port}, function () {
    log.info("connected");
    var produceRequest = {
        requiredAcks: 1,
        timeout: 12344,
        topics: [
            {
                topicName: argv.topic,
                partitions: [
                    {
                        partitionId: 1,
                        messages: [
                            {key: null, value: "test message without key on partition 1"},
                            {key: "key", value: "test message with key on partition 1"}
                        ]
                    },
                    {
                        partitionId: 0,
                        messages: [
                            {value: "test message without key on partition 0"},
                            {key: "key", value: "test message with key on partition 0"}
                        ]
                    }
                ]
            }
        ]
    }

    producer.produce(produceRequest, function (response) {
        log.info(JSON.stringify(response, null, 2));
        producer.close();
    })


});