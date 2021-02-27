
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

This is a working version of the TP-Link HS100/HS110 that supports the new KLAP encryption on UK hardware 4.1 with firmware 1.1.0.  

It is exceptionally hacky and requires a custom build of python-kasa https://github.com/ghostseven/python-kasa with changes by https://github.com/SimonWilkinson. This custom build must be installed by becoming root (dont just sudo it, it wont work), then running the following from the python-kasa folder:  pip3 install python-kasa/ --system

