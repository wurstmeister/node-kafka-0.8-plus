var Producer = require('../lib/Producer');
var producer = new Producer({host: 'localhost'}, function () {
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
                            {key: "key", value: "test message with key on partition 0"},
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