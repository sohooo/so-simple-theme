---
layout: post
title: Syncing with Unison
description: "Setup bi-directional synchronization while dealing with updates on both replicas"
category: articles
tags: [unison, sync]
---

Syncing with Unison
-------------------

When it comes to synchronization tools, the first thing which comes to mind: [there are a lot of them](http://en.wikipedia.org/wiki/Comparison_of_file_synchronization_software). Most of those tools have their use in different scenarios, like Dropbox for sharing of (limited amounts of) non-sensible data.

Here we take a look at [Unison](http://www.cis.upenn.edu/~bcpierce/unison/) to sync various folders on our computer with an USB drive.


Why Unison?
-----------

Why should you care? Well, the [Unison website](http://www.cis.upenn.edu/~bcpierce/unison/) lists a couple of features to answer that, such as:

* portability; you can even sync a Windows laptop with a Unix server
* no superuser privileges needed
* network bandwith optimization
* clear and precise specification
* free & open source under the GNU Public License

However, *these two* features are the most notable and distinctive ones compared to most of the other tools:

> Unlike simple mirroring or backup utilities, Unison __can deal with updates to both replicas__ of a distributed directory structure. Updates that do not conflict are propagated automatically. Conflicting updates are detected and displayed.

*and*

>Unison is __resilient to failure__. It is careful to leave the replicas and its own private structures in a sensible state at all times, even in case of abnormal termination or communication failures.

To summarize: Unison enables bi-directional syncing of documents on your desktop with an USB drive or your computer at work, in a simple to use commandline interface.


Setup
-----

The latest stable version can be found on the [official download mirror](http://www.seas.upenn.edu/~bcpierce/unison//download/releases/stable/). However, we [Homebrew](http://brew.sh/) users on Mac OS X simply do:

~~~ bash
brew install unison
# <installation process>
unison -version
unison version 2.40.102
~~~


Usage
-----

I recommend reading the [Basic Concepts](http://www.cis.upenn.edu/~bcpierce/unison/download/releases/stable/unison-manual.html#basics) and the [Tutorial](http://www.cis.upenn.edu/~bcpierce/unison/download/releases/stable/unison-manual.html#tutorial) of the documentation. From then on, you will mostly refer to the [Reference Guide](http://www.cis.upenn.edu/~bcpierce/unison/download/releases/stable/unison-manual.html#reference) in normal use.


After you've tried to repeatedly sync two local directories while modifying files in the process, you're ready to create profiles in your `.unison` folder. To start with a template, you can fork [my `dotunison` repo on Github](https://github.com/sohooo/dotunison) and change the `*.prf` profiles as needed. The `io.prf` could be considered an advanced profile and includes most of the useful stuff for everyday use.


Going deeper
------------

Here are some things I learned in the process of using Unison.

### General

Most USB sticks are formatted with FAT, one of the few truly portable (if poorly featured) filesystems. We don't want Unison to consider file permissions, as FAT only supports a subset of the permissions compared to \*nix systems:

~~~ ruby
perms = 0
~~~

You can also protect your sync folders from being wiped by accident, which can happen when dealing with mount points and removable media. To Unison, an unmounted drive looks like a missing directory, which is dutifully replicated to your local path. You can prevent this with:

~~~ ruby
mountpoint = <somefile>
~~~

From the docs about [Mount Points and Removable Media](http://www.cis.upenn.edu/~bcpierce/unison/download/releases/stable/unison-manual.html#mountpoints):

> To prevent accidents, Unison provides a preference called mountpoint. Including a line like [the obove] in your preference file will cause Unison to check, after it finishes detecting updates, that something actually exists at the path foo on both replicas; if it does not, the Unison run will abort. 


### Mac OS X

Syncing resource forks is not worth the hassle, so ignore them:

~~~ ruby
rsrc = false
~~~

Also, ignore those special OS X files wich even may be updated during a sync. Take a look at [my `ignores` file](https://github.com/sohooo/dotunison/blob/master/ignores).



Resources
---------

* [User Manual and Reference Guide](http://www.cis.upenn.edu/~bcpierce/unison/download/releases/stable/unison-manual.html)
* [Unison FAQs](https://alliance.seas.upenn.edu/~bcpierce/wiki/index.php)

