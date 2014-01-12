function Schema() {

    this.schema = {
        message: {
            crc: 'int32',
            magicByte: 'int8',
            attributes: 'int8',
            key: ['bytes'],
            value: ['bytes']
        },
        response: {
            size: 'int32',
            correlationId: 'int32'
        },
        fetchResponse: {
            topicsAndPartitions: [
                {
                    name: 'string',
                    partitions: [
                        {
                            id: 'int32',
                            errorCode: 'int16',
                            highwaterMarkOffset: 'int64',
                            messageSetSize: 'int32'
                            // message set will be initialized by the parser if present
                        }
                    ]
                }
            ]
        },
        metaDataResponse: {
            brokers: [
                {
                    nodeId: 'int32',
                    host: 'string',
                    port: 'int32'
                }
            ],
            topicMetaData: [
                {
                    errorCode: 'int16',
                    topicName: 'string',
                    partitionMetadata: [
                        {
                            errorCode: 'int16',
                            partitionId: 'int32',
                            leader: 'int32',
                            replicas: ['int32'],
                            isr: ['int32']
                        }
                    ]
                }
            ]
        },
        offsetResponse: {
            offsets: [
                {
                    name: 'string',
                    partitions: [
                        {
                            id: 'int32',
                            errorCode: 'int16',
                            offset: ['int64']
                        }
                    ]
                }
            ]
        },
        produceResponse : {
            topicsAndPartitions : [
                {
                    name: 'string',
                    partitions: [
                        {
                            id: 'int32',
                            errorCode: 'int16',
                            offset: 'int64'
                        }
                    ]
                }
            ]
        }
    }
}


module.exports = Schema;
