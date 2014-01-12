function KafkaError(errorCode) {
    var errors = [];
    errors.push("NoError");
    errors.push("OffsetOutOfRange");
    errors.push("InvalidMessage");
    errors.push("UnknownTopicOrPartition");
    errors.push("InvalidMessageSize");
    errors.push("LeaderNotAvailable");
    errors.push("NotLeaderForPartition");
    errors.push("RequestTimedOut");
    errors.push("BrokerNotAvailable");
    errors.push("ReplicaNotAvailable");
    errors.push("MessageSizeTooLarge");
    errors.push("StaleControllerEpochCode");
    errors.push("OffsetMetadataTooLargeCode");

    if ( errorCode < 0 || errorCode >= errors.length ) {
        this.error = "Unknown";
    } else {
        this.error = errors[errorCode]
    }
}

module.exports = KafkaError;
