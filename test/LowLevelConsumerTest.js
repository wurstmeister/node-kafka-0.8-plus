var Consumer = require('../lib/LowLevelConsumer');

var consumer = new Consumer({host: 'localhost'}, function () {

    consumer.getTopicMetadata(["node-topic"], function (response) {
        console.log(response);
    });

    var fetchTopics = [
        {
            name: "node-topic",
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
            console.log(partitionInfo)

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

    getMessages("node-topic", function (msg) {
        console.log("received message: " + msg)
    })

});






