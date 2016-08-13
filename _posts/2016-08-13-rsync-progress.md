---
layout: post
title: "rsync's new progress feature"
description: "How to show the progress of the whole sync task without third-party hacks"
category: articles
tags: [bash, rsync]
---

rsync version 3.1.0 introduced the new flag `--info=progress2`, which summarizes the progress of the whole rsync task in one line, which is a huge improvement compared to the normal `--progress` or `-v` flags. We use the following flags:

- `--archive` for archive mode, which equals `-rlptgoD`
- `--no-i-r` (or `--no-inc-recursive`) to disable incremental scan; this gives us a better estimate of progress for the price of an initial delay
- `--info=progress2` outputs statistics based on the whole transfer, rather than individual files

``` bash
% rsync \
  --archive \
  --no-i-r \
  --info=progress2 \
  ~/Documents/books sven@freenas:/mnt/zdata/ebooks/
    176,182,053   6%    5.78MB/s    0:07:19  xfr#8, to-chk=1158/1167)
```

## Setup on OS X

The default version (2.6.9) on OS X is far too old, so we grab a new one via our trusty [Homebrew](http://brew.sh/):

``` bash
# install rsync
# it's in homebrew/dupes because we've already got
# a rsync version on our system
sven@aiur [~]
% brew install homebrew/dupes/rsync
==> Pouring rsync-3.1.2.el_capitan.bottle.tar.gz
🍺  /usr/local/Cellar/rsync/3.1.2: 8 files, 749K

# show version
% which rsync
/usr/local/bin/rsync
% rsync --version
rsync  version 2.6.9  protocol version 29
...
```

rsync is installed, but we need to restart the terminal so the new version gets picked up. The fastest way to do that is via `hash -r`:

``` bash
% hash -r
% which rsync
/usr/local/bin/rsync
% rsync --version
rsync  version 3.1.2  protocol version 31
...
```
