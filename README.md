node-kafka-0.8-plus
===================

nodejs library for [Apache Kafka 0.8](https://cwiki.apache.org/confluence/display/KAFKA/A+Guide+To+The+Kafka+Protocol) and above

Goal
----

The main goal of this library is to implement the kafka 0.8 protocol to enable the implementation of consumers and producers in javascript


Testing
-------

The producer and consumer test is based on a single broker environment

With a single broker running on localhost:

- ```$KAFKA_HOME/bin/kafka-create-topic.sh --topic node-topic --partition 2 --replica 1 --zookeeper localhost```
- ```node test/LowLevelConsumerTest.js```
- ```node test/ProducerTest.js```

Todo
----

- error handling
- configuration
- support for gzip/snappy
- high level consumer implementation
