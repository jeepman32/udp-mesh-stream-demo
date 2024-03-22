#!/bin/bash

mkdir -p /var/run/dbus
dbus-uuidgen >/var/lib/dbus/machine-id
adduser root pulse-access
adduser root pulse

export DBUS_SESSION_BUS_ADDRESS="$(dbus-daemon --fork --config-file=/usr/share/dbus-1/session.conf --print-address)"

echo $DBUS_SESSION_BUS_ADDRESS

pulseaudio -D --exit-idle-time=-1 --system --disallow-exit -vvvvv

pacmd load-module module-virtual-sink sink_name=virtual
pacmd set-default-sink virtual
pacmd set-default-source virtual
pacmd load-module module-alsa-sink device=default
pacmd load-module module-alsa-source device=default
pacmd load-module module-native-protocol-unix
pacmd list-cards
pacmd list-sinks

npm run start
