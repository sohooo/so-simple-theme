---
layout: post
title: An optimized Download Station
description: "Setup a well-known downloading toolkit on Raspberry Pi and optimize the setup to reduce noise and save energy"
category: articles
tags: [raspberry pi, download, tutorial]
---

This post is about transforming the Raspberry Pi into a powerful download station, while trying to to reduce noise and power consumption.


The download package
--------------------

The [Raspberry Pi Mediacenter]({% post_url 2013-11-23-raspberry-pi-mediacenter %}) post showed how to turn that little guy into an awesome mediacenter setup. An useful addition is the [installation of xbian-package-download](http://forum.xbian.org/thread-1018.html):

> For everyone new to this, this is an all-in one fully automated newsserver and torrent downloader. After configuring all you will have to do is tell it what movies, tvshows and music you like and it will be downloaded once available. 

The `xbian-package-download` is a meta-package which includes:

* [Transmission](http://www.transmissionbt.com)
* [NZBGet](http://nzbget.sourceforge.net)
* [Sickbeard (TPB Edition)](https://github.com/xbianonpi/Sick-Beard-TPB)
* [Couch Potato](https://couchpota.to)
* [Headphones](https://github.com/rembo10/headphones)


hdparm, the dangerous
---------------------

In the above mentioned setup we probably attach an USB disk (via a powered hub) to the Pi as a destination for downloads. However, this potentially prevents the disk from spinning down and going into the silent standby mode.

The `hdparm` commandline utility shows and configures hardware parameters of our disk. We can query power management information and put it in sleep mode. Before using it, read the [hdparm man page](http://linux.die.net/man/8/hdparm) with warnings like __VERY DANGEROUS, DO NOT USE!!__ strewn at large.

The following commands require `sudo` and the disk name, or even better: the UUID:

{% highlight bash %}
# list UUID of all disks
sudo blkid

# or ask for a specific UUID
sudo blkid /dev/sda1

# you can also see the association here
ls -la /dev/disk/by-uuid/

# let's remember this
# /dev/sda1: LABEL="lacie" UUID="d5cc9cdd-6425-480c-bafb-9653cec72e64" TYPE="ext4" 
disk=/dev/disk/by-uuid/d5cc9cdd-6425-480c-bafb-9653cec72e64
{% endhighlight %}

Now, let's get some hardware infos about our disk:

{% highlight bash %}
# the params we use
sudo hdparm -h
 -I   Detailed/current information directly from drive
 -C   Check drive power mode status
 -S   Set standby (spindown) timeout
 -y   Put drive in standby mode

# general information
sudo hdparm -I $disk
{% endhighlight %}

Configuring standby mode
------------------------

We can also view and set the power mode:

{% highlight bash %}
# power mode status
sudo hdparm -C $disk

/dev/disk/by-uuid/d5cc9cdd-6425-480c-bafb-9653cec72e64:
 drive state is:  active/idle

# put drive into standby
sudo hdparm -y $disk

/dev/disk/by-uuid/d5cc9cdd-6425-480c-bafb-9653cec72e64:
 issuing standby command

# check mode
sudo hdparm -C $disk

/dev/disk/by-uuid/d5cc9cdd-6425-480c-bafb-9653cec72e64:
 drive state is:  standby
{% endhighlight %}

Finally, we use `hdparm -S <arg>` to set a more aggressive standby timeout. We read the
[hdparm man page](http://linux.die.net/man/8/hdparm) to get some infos about the usage and smile while reading this funky explanation:

> The encoding of the timeout value is somewhat peculiar. A value of zero means "timeouts are disabled": the device will not automatically enter standby mode. Values from 1 to 240 specify multiples of 5 seconds, yielding timeouts from 5 seconds to 20 minutes. Values from 241 to 251 specify from 1 to 11 units of 30 minutes, yielding timeouts from 30 minutes to 5.5 hours. A value of 252 signifies a timeout of 21 minutes. A value of 253 sets a vendor-defined timeout period between 8 and 12 hours, and the value 254 is reserved. 255 is interpreted as 21 minutes plus 15 seconds. Note that some older drives may have very different interpretations of these values.

To permanently set harddisk options like the standby timeout,  we could add an entry in `/etc/hdparm.conf`. However at the time of this writing, some Debian-based distros seem to lose these settings after a reboot, so we decide to add the following to `/etc/rc.local`:

{% highlight bash %}
# sleep after 10min for lacie disk
sleep 5
uuid=d5cc9cdd-6425-480c-bafb-9653cec72e64
hdparm -S 120 /dev/disk/by-uuid/$uuid
{% endhighlight %}


Taming Sickbeard
----------------

There are two settings we need to consider:

1. __Search Frequency__ in `http://pi:9094/config/search/`
2. __Scan and Process__ in `http://pi:9094/config/postProcessing/` 

Set the first one to `120` minutes to look for new episodes. If `Scan and Process` is activated, Sickbeard searches the download destination __every 10 minutes__ for something to post-process (move to episodes location, update XBMC library). On one side, this is very convenient. However, there's currently no way to increase the timespan between the post-process scans. This means that every 10 minutes, our disk spins up from the silent standby sleep. So we disable it.


Triggering Post-Processing
--------------------------

Looking for a way to manually trigger the post-processing of downloaded episodes, the first stop is the official [Sickbeard API](http://sickbeard.com/api/). It has a lot of features, but unfortunately, post-processing currently isn't one of them.

To fill the gap in the meantime, I wrote the following simple Ruby script ([Github Gist](https://gist.github.com/sohooo/8493102)). It uses [Mechanize](http://mechanize.rubyforge.org) to effectively visit our Sickbeard webapp and toggle the manual post-processing:

{% highlight ruby %}
require "rubygems"
require "mechanize"
 
site = 'http://pi:9094/home/postprocess/'
user = 'xbian'
pass = 'raspberry'
 
downloads = '/home/xbian/downloads/tv'
 
agent = Mechanize.new
agent.add_auth(site, user, pass)
agent.get(site) do |page|
  processed = page.form_with(:name => 'processForm') do |processing|
    processing.dir = downloads
  end.submit
 
  puts processed.search("#content")
end
{% endhighlight %}

Now we can run this script to trigger post-processing via `cron` whenever we like.
