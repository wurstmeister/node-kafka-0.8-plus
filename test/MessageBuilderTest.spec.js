var Builder = require('../lib/Builder');
var Parser = require('../lib/Parser');
var builder = new Builder();

var produceRequest = {
    requiredAcks: 1,
    timeout: 12344,
    topics: [
        {
            topicName: "topic1",
            partitions: [
                {
                    partitionId: 1,
                    messages: [
                        {key: null, value: "message without key"},
                        {key: "key", value: "message with key"}
                    ]
                },
                {
                    partitionId: 0,
                    messages: [
                        {value: "message without key property"},
                    ]
                }
            ]
        },
        {
            topicName: "topic2",
            partitions: [
                {
                    partitionId: 4,
                    messages: [
                        {key: "", value: ""}
                    ]
                }
            ]
        }
    ]

}
var schema = {

    test: {
        requiredAcks: "int16",
        timeout: "int32",
        topicsAndPartitions: [
            {
                name: "string",
                partitions: [
                    {
                        id: "int32",
                        messageSetSize: "int32"
                        // message set will be initialized by the parser if present
                    }
                ]
            }
        ]
    },
    message: {
        crc: "int32",
        magicByte: "int8",
        attributes: "int8",
        key: ["bytes"],
        value: ["bytes"]
    }
}


describe('message', function () {

    it('should build and parse a correct message', function (done) {
        var requestMessage = builder.buildBuffer(produceRequest);
        var parser = new Parser(schema);
        var parsed = parser.parse(requestMessage, schema.test);
        var topics = produceRequest.topics;
        for (var t = 0; t < topics.length; t++) {
            var originalPartitions = topics[t].partitions;
            var parsedPartitions = parsed.topicsAndPartitions[t].partitions;
            for (var p = 0; p < originalPartitions.length; p++) {
                var originalMessageSet = originalPartitions[p].messages;
                var parsedMessageSet = parsedPartitions[p].messageSet;
                for (var i = 0; i < originalMessageSet.length; i++) {
                    expect(parsedMessageSet[i].key).toEqual(originalMessageSet[i].key);
                    expect(parsedMessageSet[i].value).toEqual(originalMessageSet[i].value);
                }
            }
        }
        done();
    });

    it('should not allow an undefined message', function (done) {
        var invalid = {
            requiredAcks: 1,
            timeout: 12344,
            topics: [
                {
                    topicName: "topic1",
                    partitions: [
                        {
                            partitionId: 1,
                            messages: [
                                {key: "key"}
                            ]
                        }
                    ]
                }
            ]
        };


        var testFunction = function() {
            var requestMessage = builder.buildBuffer(invalid);
        }

        expect(testFunction).toThrow();
        done();
    })
});

