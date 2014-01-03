# Apache Kafka #

Using Vagrant to get up and running.

1. Install Vagrant [http://www.vagrantup.com/](http://www.vagrantup.com/)  
1. Install Virtual Box [https://www.virtualbox.org/](https://www.virtualbox.org/)  
1. git clone https://github.com/wurstmeister/node-kafka-0.8-plus
1. cd node-kafka-0.8-plus
1. vagrant up

once this is done 
* Broker 1   :  192.168.40.10
* node.js 1  :  192.168.40.99
* Zookeeper 1:  192.168.40.5

When you are all up and running you will be back at a command brompt.  

bin/kafka-console-producer.sh --broker-list 192.168.40.10:9092,192.168.40.20:9092,192.168.40.30:9092 --topic sandbox

bin/kafka-console-consumer.sh --zookeeper 192.168.40.5:2181 --topic sandbox --from-beginning

vagrant ssh nodejs
cd /vagrant
- ```node test/LowLevelConsumerTest.js```
- ```node test/ProducerTest.js```
