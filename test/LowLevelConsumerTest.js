var Consumer = require('../lib/LowLevelConsumer');
var Optimist = require('optimist');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
    name:"low-level-consumer-test",
    level: bunyan["DEBUG"]
});

var argv = Optimist.usage('Usage: $0 --host [host] --port [port] --topic [topic]').
    default('port', 9092).
    default('host', 'localhost').
    default('topic', 'node-topic').argv;


log.info("Connecting to: " + argv.host + ":" + argv.port);

var consumer = new Consumer({host: argv.host, port: argv.port}, function () {

    consumer.getTopicMetadata([argv.topic], function (response) {
        log.info(JSON.stringify(response, null, 2));
    });

    var fetchTopics = [
        {
            name: argv.topic,
            partitions: []
        }
    ]

    var getMessages = function (topic, messageListener) {
        consumer.getOffsets([
            {
                name: topic,
                partitions: [
                    {
                        partitionId: 0,
                        time: -1,
                        maxNumberOfOffsets: 100
                    },
                    {
                        partitionId: 1,
                        time: -1,
                        maxNumberOfOffsets: 100
                    }
                ]
            }
        ], function (response) {

            var partitionInfo = response.offsets[0].partitions;
            log.info(partitionInfo)

            for (var p = 0; p < partitionInfo.length; p++) {
                var partition = {
                    partitionId: partitionInfo[p].id,
                    fetchOffset: partitionInfo[p].offset ? partitionInfo[p].offset[0] : -1,
                    maxBytes: 1024 * 1024
                }
                fetchTopics[0].partitions[partitionInfo[p].id] = partition
            }


            var processFetchResponse = function (fetchResponse) {
                var partitionInfo = fetchResponse.topicsAndPartitions[0].partitions;
                for (var p = 0; p < partitionInfo.length; p++) {
                    var partition = {
                        partitionId: partitionInfo[p].id,
                        fetchOffset: partitionInfo[p].highwaterMarkOffset,
                        maxBytes: 1024 * 1024
                    }
                    if (partitionInfo[p].messageSet) {
                        for (var m = 0; m < partitionInfo[p].messageSet.length; m++) {
                            messageListener(partitionInfo[p].messageSet[m].value);
                        }
                    }

                    fetchTopics[0].partitions[partitionInfo[p].id] = partition
                }
                return fetchTopics;
            }

            var callback = function (fetchResponse) {
                var newFetchTopic = processFetchResponse(fetchResponse);
                setTimeout(function () {
                    consumer.fetch(newFetchTopic, callback);
                }, 500);
            };


            consumer.fetch(fetchTopics, callback)
        });
    }

    getMessages(argv.topic, function (msg) {
        log.info("received message: " + msg)
    })

});






