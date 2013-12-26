# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
# 
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/sh -Eux
archiveDir=$1
archive=$archiveDir.tar.gz
sudo apt-get install -y python g++ make checkinstall
cd /tmp
sudo wget -N http://nodejs.org/dist/v$archiveDir/node-v$archive
sudo tar xzvf node-v$archive && mv node-v$archiveDir node-$archiveDir #(remove the "v" in front of the version number in the dialog)
cd node-$archiveDir
sudo ./configure
sudo checkinstall 
