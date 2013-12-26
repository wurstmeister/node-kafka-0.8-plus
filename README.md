node-kafka-0.8-plus
===================

nodejs library for [Apache Kafka 0.8](https://cwiki.apache.org/confluence/display/KAFKA/A+Guide+To+The+Kafka+Protocol) and above

Goal
----

The main goal of this library is to implement the kafka 0.8 protocol to enable the implementation of consumers and producers in javascript


Environment setup
-----------------

## Docker - [https://www.docker.io/](https://www.docker.io/)

- If you are running docker within vagrant and want to connect to your broker from outside vagrant, ensure you've enabled port forwarding
    - ```FORWARD_DOCKER_PORTS='true' vagrant up```
- Start a broker
    - ```start-broker.sh <brokerId> <port> <hostIp>```
- Start a kafka shell
    - ```start-kafka-shell.sh```
- From within the shell, create a topic
    - ```$KAFKA_HOME/bin/kafka-topics.sh --create --topic node-topic --partitions 2 --zookeeper $ZK_PORT_2181_TCP_ADDR --replication-factor 1```
- For more details and troubleshooting see [https://github.com/wurstmeister/kafka-docker](https://github.com/wurstmeister/kafka-docker)

## Vagrant

- tbd (Pending pull request)

Testing
-------



1. ```git clone https://github.com/wurstmeister/node-kafka-0.8-plus.git```
1. ```cd node-kafka-0.8-plus```
1. ```npm install```
1. ```node test/LowLevelConsumerTest.js --host=<hostIp> --port=<port>```
1. ```node test/ProducerTest.js --host=<hostIp> --port=<port>```

Todo
----

- error handling
- configuration
- support for gzip/snappy
- high level consumer implementation
