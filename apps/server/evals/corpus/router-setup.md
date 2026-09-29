Home network setup

The main router is a Mikrotik hAP ax3 in the hallway cupboard. The fibre modem from the ISP sits next to it in bridge mode, so the Mikrotik does PPPoE itself. The PPPoE username is on the sticker under the modem, and the password is in the family password manager under "ISP line".

There are three networks. The main one is for our laptops and phones. The second one, called "attic", is VLAN 30 and carries only the cameras, the thermostat and the smart plugs; it cannot reach the main network at all, only the internet. The third is the guest network, which gets a new password on the first of every month. I print the current one on a card and leave it on the fridge.

Wi-Fi: the 5 GHz radio is pinned to channel 36 at 80 MHz, because auto channel selection kept jumping onto a DFS channel and then going silent for a minute whenever the radar check ran. The 2.4 GHz radio stays on channel 6 and exists mostly for the older smart plugs, which cannot join 5 GHz.

Addressing: the main network uses 192.168.10.0/24 and the attic network uses 192.168.30.0/24. The NAS has a static lease at 192.168.10.5 and the printer at 192.168.10.9. DNS goes to the Pi-hole on the NAS first, with Quad9 as the fallback, so ads stay blocked even if the NAS reboots.

Firmware updates: I check for RouterOS updates on the first Sunday of the month, take an export of the config first (System, Export, saved to the NAS under backups/router), and only update on the stable channel. The last time I tried the testing channel, the guest network stopped handing out addresses for a whole evening.

If the internet drops: first look at the modem. A red LOS light means the fibre itself is down and only the ISP can fix it; call them on the number in the password manager. If the modem looks fine, power-cycle the Mikrotik, wait two full minutes, and check again before calling anyone.
