function StringDeserializer() {

    var hasValue = function(value) {
        return typeof value !== 'undefined' && value !== null;
    }

    this.deserialize = function(messageBytes) {
        if (hasValue(messageBytes)) {
            return messageBytes.toString('utf8');
        } else {
            return null;
        }
    }
}

module.exports = StringDeserializer;
