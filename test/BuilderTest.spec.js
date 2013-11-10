var Builder = require('../lib/Builder');
var Parser = require('../lib/Parser');
var builder = new Builder();


var fetchMessage = function () {
    var topics = [
        {
            name: "topic1",
            partitions: [
                {
                    partitionId: 1,
                    fetchOffset: 4,
                    maxBytes: 1024 * 1024
                },
                {
                    partitionId: 2,
                    fetchOffset: 4,
                    maxBytes: 1024 * 1024
                } ,
                {
                    partitionId: 4,
                    fetchOffset: 4,
                    maxBytes: 1024 * 1024
                }
            ],
            complexArrays: [
                {
                    fetchOffset: [455, 958742, 84329]
                }
            ]


        }
    ];
    return topics;
}


var schema = {

    topicsAndPartitions: [
        {
            name: "string",
            partitions: [
                {
                    partitionId: "int32",
                    fetchOffset: "int64",
                    maxBytes: "int32"
                }
            ],
            complexArrays: [
                {
                    fetchOffset: ["int64"]
                }
            ]
        }
    ]
}


describe('builder', function () {
    it("build a correct buffer and parse it", function (done) {
        var requestMessage = builder.buildBuffer(fetchMessage());
        var parser = new Parser(schema);
        var parsed = parser.parse(requestMessage, schema.topicsAndPartitions)
        expect(parsed).toEqual(fetchMessage());
        done();
    });
});