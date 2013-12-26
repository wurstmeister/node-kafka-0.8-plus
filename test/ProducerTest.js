var Producer = require('../lib/Producer');
var Optimist = require('optimist');

var argv = Optimist.usage('Usage: $0 --host [host] --port [port]').
    default('port', 9092).
    default('host', 'localhost').argv;

console.log("Connecting to: " + argv.host + ":" + argv.port);

var producer = new Producer({host: argv.host, port: argv.port}, function () {
    console.log("connected");
    var produceRequest = {
        requiredAcks: 1,
        timeout: 12344,
        topics: [
            {
                topicName: "node-topic",
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
        console.log(response);
        producer.close();
    })


});