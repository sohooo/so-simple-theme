---
layout: post
title: Raspberry Pi Mediacenter
description: "Setup a powerful mediacenter on the Raspberry Pi"
category: articles
tags: [raspberry pi, mediacenter]
---

![Raspberry Pi Model B](/images/pi-modelb.png)

There's a whole lot of XMBC mediacenter implementations for the [Raspberry Pi](http://www.raspberrypi.org). After trying [OpenELEC](http://openelec.tv), I recently switched to [XBian](http://www.xbian.org) for its auto-updating and backup features. What is XBian?

> XBian is a small, fast and lightweight media center distro for the Raspberry Pi, based on a minimal Raspbian image. Our slogan is “XBMC on Raspberry Pi, the bleeding edge” as our main focus is delivering the fastest XBMC solution for the Raspberry Pi.

The following guide will get you up and running in no time.


Requirements
------------

* TV, obviously
* Raspberry Pi
* HDMI, LAN, and USB power cable
* 16GB SD card
* SMB media share


Installation
------------

Download an XBian image [from the official website](http://www.xbian.org/download/) and extract the .img file. You can follow [the eLinux guide](http://elinux.org/RPi_Easy_SD_Card_Setup#Using_command_line_tools_.281.29) to set up the SD card. Assuming you use OS X:


{% highlight bash %}
# identify the disk (not partition)
diskutil list

# unmount disk
diskutil unmountDisk /dev/disk2

# copy image
sudo dd if=~/Downloads/xbian.beta2.2013-11-16rs.img of=/dev/disk2 bs=1m
{% endhighlight %}

That's it, now boot the RPi with your shiny new XBian OS.


Basic Configuration
-------------------

The XBian Wizzard should be the first thing you see. Enable automatic updates. After finishing the wizzard, head over to the SYSTEM menu and go through the options. All those dialogs (except the last one called "XBian") are standard XBMC settings (Appearance, Add-ons, ...) which you'll also find in other mediacenter distributions. Adjust your location and language settings if you need.


Adding Media
------------

Your movies and TV shows should be organized according to the [naming conventions](http://wiki.xbmc.org/index.php?title=Video_library/Naming_files):

{% highlight bash %}
# pattern for movies: title (year) extension
\Movies\Pulp Fiction (1994).avi
\Movies\Reservoir Dogs (1992).avi
\Movies\The Usual Suspects (1995).avi
{% endhighlight %}

This allows XBMC to pick up all the relevant assets (cover art, rating, ...). Now follow [the guide to add media sources](http://wiki.xbmc.org/index.php?title=Video_library/Adding_media_sources) for every content type (movies, tv shows) you want to include.


Additional Resources
--------------------

* [XBian FAQ](http://www.xbian.org/faqs/)
* [Raspberry Pi FAQ](http://wiki.xbmc.org/index.php?title=Raspberry_Pi/FAQ)
* [XBMC skins](http://wiki.xbmc.org/index.php?title=Category:Skins) and [some screenshots](http://wiki.xbmc.org/index.php?title=Skin_screenshots); considering the limited CPU resources of the Pi, the FAQ above recommends these lite skins: Confluence (default skin), Amber, Metropolis, Quartz, Quartz Reloaded, Slik, xTV-SAF.
* [Advanced Topics](http://wiki.xbmc.org/index.php?title=Advanced_topics), like remotely updating the library.
