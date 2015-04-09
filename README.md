# [PrimeFaces Unofficial](http://unofaces.github.io/unofficial-primefaces/)
[![Build Status](https://buildhive.cloudbees.com/job/primefaces/job/primefaces/badge/icon)](https://buildhive.cloudbees.com/job/primefaces/job/primefaces/)

Unofficial Mirror of PrimeFaces JSF Components


## Why?

The [New Maintanance Policy](http://blog.primefaces.org/?p=2443) doesn't have freely available releases starting with PrimeFaces 3.5.

This work initiative aims to provide freely available repositories with the result of an integration effort of each change from [original open source repository](https://code.google.com/p/primefaces/source/list). All sources came from the original repository under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).


## Maven Repository

Downloading unofficial releases with Maven:

```xml
<repository>
  <id>unofaces-repo</id>
  <name>Unofficial PrimeFaces Maven Repository</name>
  <url>http://unofaces.github.io/repository</url>
  <layout>default</layout>
</repository>
```

## Building Artifacts

> mvn clean install -Prelease -Dgpg.skip=true
