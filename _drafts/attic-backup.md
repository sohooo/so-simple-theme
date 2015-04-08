---
layout: post
title: Attic - Backup of a new generation
description: "Attic is a deduplicating backup program, with a focus on efficiency and security."
category: articles
tags: [attic, backup, deduplication, encryption, python]
image:
  feature: articles/webapp/yeoman.jpg
  credit: http://addyosmani.com
---

A modern backup solution should ideally provide these features:

- secure; only encrypted data should leave the machine
- bandwith-efficient, via deduplication mechanisms
- space-efficient, with a way to prune old bakcups
- open-source, actively maintained
- and: cheap.

[Attic](https://attic-backup.org) belongs to the new-generation hash-backup tools, like [http://obnam.org](obnam), [https://github.com/bup/bup](bup), etc. Attic is written in Python, with a smooth installation process and the commandline interface is easy to use.


mappu on [https://news.ycombinator.com/item?id=8621372](HackerNews) succinctly describes the appeal of attic:

> It provides encrypted incremental-forever (unlike duplicity, duplicati, rsnapshot, rdiff-backup, Ahsay etc) with no server-side processing and a convenient CLI interface, and it does let you prune old backups. All other common tools seem to fail on one of the following points:
- Incremental forever (bandwidth is expensive in a lot of countries)
- Untrusted remote storage (so i can hook it up to a dodgy lowendbox VPS)
- Optional: No server-side processing needed (so i can hook it up to S3 or Dropbox)
>
> If your backup model is based on the old' original + diff(original, v1) + diff(v1, v2).. then you're going to have a slow time restoring. rdiff-backup gets this right by reversing the incremental chain. However, as soon as you need to consolidate incremental images, you lose the possibility of encrypting the data (since encrypt(diff()) is useless from a diff perspective).
>
> But with a hash-based backup system? All restore points take constant time to restore.
Duplicity, Duplicati 1.x, and Ahsay 5 don't support incremental-forever. Ahsay 6 supports incremental-forever at the expense of requiring trust in the server (server-side decrypt to consolidate images). Duplicati 2 attempted to move to a hash-based system but they chose to use fixed block offsets rather than checksum-based offsets, so the incremental detection is inefficient after an insert point.



# Installation

You're going to need Python 3.2 as per [https://attic-backup.org/installation.html#installation](Attic installation requirements). Take a look at the [https://www.python.org/downloads/](offical website) or consult your package manager of choice. On Mac OS X, there's [http://brew.sh](Homebrew):

{% highlight bash %}
# install python 3
brew install python3

# install attic via pip
pip3 install --upgrade pip setuptools
pip3 install attic
{% endhighlight %}

If you get the Attic usage by typing `attic`, you're good to go.



# Initialization

The [https://attic-backup.org/quickstart.html](Attic Quickstart) is very easy to follow. First, notice that Attic has the notion of a _repository_, which needs to be initialized first. This repository holds your subsequent backups.

{% highlight bash %}
# initialize our test repository
% attic init /Volumes/Phobos/test.attic
Initializing repository at "/Volumes/Phobos/test.attic"
Encryption NOT enabled.
Use the "--encryption=passphrase|keyfile" to enable encryption.
{% endhighlight %}

As you can see, Attic immediately prints a nice reminder that our repo is not encrypted. For now, we don't care because we're testing and want to get a feel for the tool.


# Backup

Now, let's create our first backup:

{% highlight bash %}
# usage: usage: attic create [options] ARCHIVE PATH [PATH ...]
% attic create --stats /Volumes/Phobos/test.attic::first /Users/sven/Documents/Health/
Initializing cache...
------------------------------------------------------------------------------
Archive name: first
Archive fingerprint: 5624799078817abdde96c537c847ddf31d57e8149d0c1ed4c093195e5ef7253a
Start time: Tue Mar 24 20:06:26 2015
End time: Tue Mar 24 20:06:46 2015
Duration: 19.36 seconds
Number of files: 27

                       Original size      Compressed size    Deduplicated size
This archive:              339.23 MB            310.71 MB            310.00 MB
All archives:              339.23 MB            310.71 MB            310.00 MB
------------------------------------------------------------------------------
{% endhighlight %}

The first thing we note is the `ARCHIVE PATH`, with consists of the path to the Attic repository and a label, separated by colons. The we provide path(s) to the files the want to backup. Backups are compressed and deduplicated, which means you can save quite a bit of space. However, here I'm backing up mostly PDFs and images, so the compression rate isn't very high.

Subsequent backups should be very efficient now. We add a file and create another backup:

{% highlight bash %}
% attic create --stats /Volumes/Phobos/test.attic::second /Users/sven/Documents/Health/
------------------------------------------------------------------------------
Archive name: second
Archive fingerprint: 42cccbca690e595496aed35bb588982ed4c3fb60fdf4cd03507b1de9657bc773
Start time: Tue Mar 24 20:08:56 2015
End time: Tue Mar 24 20:08:56 2015
Duration: 0.51 seconds
Number of files: 28

                       Original size      Compressed size    Deduplicated size
This archive:              340.46 MB            311.90 MB              1.23 MB
All archives:              679.69 MB            622.61 MB            311.23 MB
------------------------------------------------------------------------------
{% endhighlight %}

A duration of 0.51 seconds, that's what we want to see! The _incremental-forever_ nature of Attic means that future backups are both a lot smaller and faster.

To see a list of available archives in the repository, we use `attic list`:

{% highlight bash %}
% attic list /Volumes/Phobos/test.attic
first                                Tue Mar 24 20:06:46 2015
second                               Tue Mar 24 20:08:56 2015

# to see the files of the 'second' archive, we'd do:
% attic list /Volumes/Phobos/test.attic::second
{% endhighlight %}


# Restore

When it comes to restoring data, Attic provides these ways:

1. use `attic extract` to restore the contents of an archive
2. mount the archive with `attic mount` to be able to browse the files

## extract

First we'll use [https://attic-backup.org/usage.html#attic-extract](attic extract) to restore the full archive to the path we choose.

> This command extracts the contents of an archive. By default the entire archive is extracted but a subset of files and directories can be selected by passing a list of PATHs as arguments. The file selection can further be restricted by using the --exclude option.

{% highlight bash %}
# here we'll extract the archive
mkdir ~/mybackup
cd ~/mybackup

# extract archive with the label 'second'
% attic extract /Volumes/Phobos/test.attic::second

# as you see, attic restores the full path
% ls
Users
{% endhighlight %}


##mount

Another awesome feature is the ability to mount an archive of the repository as a FUSE filesystem, so you can browse the files and cherry-pick the things you need. You could do the following:

{% highlight bash %}
% attic mount /Volumes/Phobos/test.attic::second ~/mybackup
{% endhighlight %}

_But_: to my knowledge, Mac users can't use this feature, because `llfuse` [http://www.rath.org/llfuse-docs/index.html](requires at least FUSE 2.8), but `osxfuse` is [https://osxfuse.github.io](currently at 2.7.5). [https://github.com/osxfuse/osxfuse/issues/200](This issue) describes the problem. Oh well :/



# Maintenance

To remove old backups, Attic allows us to [https://attic-backup.org/usage.html#attic-prune](prune) the repository archives according to specific rules:

> The prune command prunes a repository by deleting archives not matching any of the specified retention options. This command is normally used by automated backup scripts wanting to keep a certain number of historic backups.

Attic has commandline switches for hourly, daily, weekly, monthly, and yearly retention times. With a daily backup job, you could say that you want 7 daily backups (for the last week), and 4 weekly ones (for the last month):

{% highlight bash %}
# Keep 7 end of day and 4 additional end of week archives:
$ attic prune /data/myrepo --keep-daily=7 --keep-weekly=4
{% endhighlight %}

Of course, many more scenarios are possible. Note that specifying a negative number of archives to keep means that there is no limit.

{% highlight bash %}
# Keep 7 end of day, 4 additional end of week archives,
# and an end of month archive for every month:
$ attic prune /data/myrepo --keep-daily=7 --keep-weekly=4 --monthly=-1

# Keep all backups in the last 10 days, 4 additional end of week archives,
# and an end of month archive for every month:
$ attic prune /data/myrepo --keep-within=10d --keep-weekly=4 --monthly=-1
{% endhighlight %}



# Encryption

As we saw earlier, encryption is enabled at repository initialization time. We delete the old repo and create a new encrypted `test.attic`:

{% highlight bash %}
% attic init --encryption=passphrase /Volumes/Phobos/test.attic
Initializing repository at "/Volumes/Phobos/test.attic"
Enter passphrase:
Enter same passphrase again:
Remember your passphrase. Your data will be inaccessible without it.
{% endhighlight %}

> When repository encryption is enabled all data is encrypted using 256-bit [https://en.wikipedia.org/wiki/Advanced_Encryption_Standard](AES) encryption and the integrity and authenticity is verified using [http://en.wikipedia.org/wiki/HMAC](HMAC-SHA256).
>
> All data is encrypted before being written to the repository. This means that an attacker that manages to compromise the host containing an encrypted archive will not be able to access any of the data.

The method above used the `passphrase` method, which you can put in the environment variable `ATTIC_PASSPHRASE` for automated backups. Another option would be _key-file based encryption_, which generates keys in `~/.attic/keys`. Needless to say, if you lose any of them, the repo data is totally inaccessible.



# Conclusion

# Further Resources
