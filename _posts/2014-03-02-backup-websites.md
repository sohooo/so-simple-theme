---
layout: post
title: Website Backup
description: "How to create an offsite backup of a CMS like Wordpress"
category: articles
tags: [rsnapshot, backup, wordpress]
---

This article shows a way to back up a content management system like Wordpress, using [rsnapshot]. The following setup creates efficient offsite backups of the CMS's __files and database__ on your notebook (perhaps with an external drive attached), or a home server.

These backups are created at __specified intervals__ (daily, weekly, monthly) whithout any interaction needed on our part.

#### Advantages of backups to your machine

- cheap storage space
- fast download speed
- no dependency on 3rd party
- easy setup of test environment

We accomplish all of this with mainly [rsnapshot], a simple [database backup script], and a cron job for scheduling, while honoring these important [backup considerations]:

> - The Retention period plays a very important role in deciding which media to use for backup.
- Storing the copy near the original is unwise, since many disasters such as fire, flood, theft, and electrical surges may affect the backup at the same time, in which case both the original and the backup medium would be lost.
- Automated backup and scheduling should be considered, as manual backups can be affected by human error.
- Incremental backups should be considered to save the amount of storage space and to avoid redundancy.
- Backups can fail for a wide variety of reasons. A verification or monitoring strategy is an important part of a successful backup plan.
- Multiple backups on different media, stored in different locations, should be used for all critical information.
- Backed up archives should be stored in open and standard formats, especially when the goal is long-term archiving. Recovery software and processes may have changed, and software may not be available to restore data saved in proprietary formats.


Ok, let's start with our main tool.


Using rsnapshot
---------------

[rsnapshot] is a backup tool based on `rsync`. It produces incremental backups by only saving changed files, while unchanged files are copied using __hardlinks__[^1]. This __space-efficient mechanism__ allows for a __high backup interval__, while every single backup behaves like a __full replica__ (e.g. the backup from last week can be restored to a local test site simply by copying the respective files).

The directory structure looks something like this:

~~~ bash
/path/to/backups $ tree -L 2
.
├── daily.0
│   ├── website1
│   └── website2
├── daily.1
│   ├── website1
│   └── website2
├── ...
├── weekly.0
│   ├── website1
│   └── website2
├── ...
├── monthly.0
├── ...
└── monthly.11
~~~



#### Setup

Install with the packet manager of your choice. On Debian, you would use `sudo apt-get install rsnapshot`.

The [rsnapshot configuration] happens in `/etc/rsnapshot.conf`, using a `TAB` separated parameter/value format[^2]. This answers the questions:

- What needs to be backed up?
- Where to put it?
- How long should it be kept?

The following config can be used as a guideline. It shows most of the options I use while ignoring the boring defaults. Adjust the paths to suit your needs. The important settings are commented or described later.

~~~ bash
#################################################
# rsnapshot.conf - rsnapshot configuration file #
#################################################

###########################
# SNAPSHOT ROOT DIRECTORY #
###########################

# All snapshots will be stored under this root directory.
#
snapshot_root	/home/xbian/downloads/backups/

# If no_create_root is enabled, rsnapshot will not automatically create the
# snapshot_root directory. This is particularly useful if you are backing
# up to removable media, such as a FireWire or USB drive.
#
no_create_root  1

#################################
# EXTERNAL PROGRAM DEPENDENCIES #
#################################

# uncomment this to use the rm program instead of the built-in perl routine.
#
cmd_rm		/bin/rm

# rsync must be enabled for anything to work. This is the only command that
# must be enabled.
#
cmd_rsync	/usr/bin/rsync

# Uncomment this to enable remote ssh backups over rsync.
#
cmd_ssh	/usr/bin/ssh

# Specify the path to a script (and any optional arguments) to run right
# after rsnapshot syncs files
#
cmd_postexec	/home/xbian/rsnapshot/postexec.sh

#########################################
#           BACKUP INTERVALS            #
# Must be unique and in ascending order #
# i.e. hourly, daily, weekly, etc.      #
#########################################

#interval	hourly	6
interval	daily	7
interval	weekly	4
interval	monthly	12

############################################
#              GLOBAL OPTIONS              #
# All are optional, with sensible defaults #
############################################

# Verbose level, 1 through 5.
# 1     Quiet           Print fatal errors only
# 2     Default         Print errors and warnings only
# 3     Verbose         Show equivalent shell commands being executed
# 4     Extra Verbose   Show extra verbose information
# 5     Debug mode      Everything
#
verbose		2
loglevel	3

logfile	/home/xbian/rsnapshot/backup.log
lockfile	/home/xbian/rsnapshot/lockfile.pid
exclude_file	/home/xbian/rsnapshot/exclude.list

###############################
### BACKUP POINTS / SCRIPTS ###
###############################

# website1
#backup_script	/usr/bin/ssh user@server '/path/to/website1/dbbackup.sh'	unused1
backup		user@server:/path/to/website1/	website1/

# website2
#backup_script	/usr/bin/ssh user@server '/path/to/website2/dbbackup.sh'	unused2
backup		user@server:/path/to/website2/	website2/
~~~

Some information about the important options:

#### Retention Time

`interval daily 7` means that rsnapshot keeps 7 backups made with the `daily` tag. So if you run `rsnapshot daily` every day, this amounts to one week of daily backups. The intervals[^3] defined in the config file work together with the cron options to schedule the backups. These are described later.

#### Postexec

I use the `postexec` option to run the following script after the backup. It removes the `unused` directories we had to define with the `backup_script` option, but don't have any purpose. We also write the disk usage with `rsnapshot du` to the config file. I use [Geektool] to show the contents of the backup logfile on my desktop.

~~~ bash
#!/bin/bash

backup_path=/home/xbian/downloads/backups
script_home=/home/xbian/rsnapshot
backup_log=${script_home}/backup.log

# remove unused dirs
find $backup_path -type d -name "unused[0-9]" -delete

# log info
echo "disk usage:" >> $backup_log
rsnapshot du       >> $backup_log
~~~

#### Test

The `rsnapshot configtest` command validates the config in `/etc/rsnapshot.conf`.
Given that passwordless SSH authentication from backupserver to webserver is set up, a `rsnapshot daily` backup should now be possible, if you keep the `backup_script` options commented out. We'll set up the database backup script in just a moment.

Now, check out the result in your `snapshot_root` directory. If you run another daily backup and view the disk usage with `rsnapshot du`, you should see that almost no additional space is needed.


Backup Wordpress
----------------

The above configuration takes care of the files. To include the MySQL database, we simply `mysqldump` it to the `wp-content/backups` directory. The following [database backup script] is placed in the same path as `wp-config.php`, as it uses the database credentials to connect to the Wordpress database.

~~~ bash
#!/bin/bash

# fail on error
set -e

pushd `dirname $0` > /dev/null
SCRIPT=`pwd -P`
popd > /dev/null

KEEP_DAYS=150
CONFIG=${SCRIPT}/wp-config.php

function extract_from_config() {
  cat $CONFIG | grep $1 | cut -d',' -f2 | tr -d '[:blank:][:punct:][:cntrl:]'
}

# get credentails from wp-config.php
NAME=$(extract_from_config "DB_NAME")
PASS=$(extract_from_config "DB_PASSWORD")
LABEL=$(date '+%Y%m%d-%H%M')
DEST=${SCRIPT}/wp-content/backups
FILE=${DEST}/dump_${NAME}-${LABEL}.sql.gz


echo "start mysql db backup of $NAME"
echo "dest: $FILE"

# setup backup destination if needed
if [[ ! -d $DEST ]]; then
  mkdir $DEST
  echo "deny from all" > ${DEST}/.htaccess
fi

# delete dumps older than 150 days
echo "deleting dumps older than ${KEEP_DAYS} days"
find ${DEST}/*.gz -type f -mtime +${KEEP_DAYS} -print
find ${DEST}/*.gz -type f -mtime +${KEEP_DAYS} -delete

# dump database
mysqldump --user=${NAME} --password=${PASS} ${NAME} | gzip -c > $FILE

# show dump size
echo "total db dumps size in ${DEST}:"
du -sh $DEST
~~~

Save this script as `dbbackup.sh` in your Wordpress directory, make it executable (`chmod 755`), and run it. It should produce a dump file in `wp-content/backups` (see `DEST` variable).

If this works, we enable the database backup in the rsnapshot config (the `backup_script` part), and test the whole process again by creating a daily backup. The database dump is now included in the file syncing process.



Schedule backups with cron
--------------------------

Finally, we schedule the backup jobs to run according to their tags. Put the following code in a file `backup_schedule.cron`, modify it to your needs, and load it with `crontab backup_schedule.cron` in the `crontab` of your current user.

~~~ bash
# daily backup at 0:00
0 0 * * *	rsnapshot daily >> /home/xbian/rsnapshot/backup.log 2>&1

# weekly backup on monday, 3:00
0 3 * * 1	rsnapshot weekly >> /home/xbian/rsnapshot/backup.log 2>&1

# monthly backup on 1st at 6:00
0 6 1 * *	rsnapshot monthly >> /home/xbian/rsnapshot/backup.log 2>&1
~~~

#### Notifications

I decided to write all messages to the `backup.log` logfile. However, if you want to receive cron notifications via email, just call `rsnapshot [tag]` and skip the redirection part. Now, cron will mail all output of the backup to your user. If there's no output, you get no mail.

So, the rsnapshot option `verbose 2` works in our favor as it only outputs only warnings and errors. We want to receive mails for that. However, you need to silence `dbbackup.sh` by yourself.

You can forward the mails to your inbox with a `.forward` file in your home dir:

~~~ bash
$ cat ~/.forward
myaddress@gmail.com
~~~


Summary
-------

These are the sequence of events:

- install and configure the [rsnapshot] backup tool
- test rsnapshot backup, view results
- set up `dbbackup.sh`, manually create db backup (and verify it!)
- include db backup in rsnapshot procedure; test!
- setup cron jobs for backup intervals
- *optional*: configure mailing; verify notifications with misconfigured backup

That's it, now you can enjoy the warm and cozy feeling of regular backups. Next, we should look into a mechanism to recover the data locally. This could be used to __verify the backups__ or to __quickly set up a development environment__.

[backup considerations]: http://en.wikipedia.org/wiki/Backup#Conclusion
[rsnapshot]: http://www.rsnapshot.org/
[rsnapshot configuration]: http://www.rsnapshot.org/rsnapshot.html
[database backup script]: https://gist.github.com/sohooo/9101278
[Geektool]: http://projects.tynsoe.org/en/geektool/


[^1]: Hardlinks are supported on common Linux filesystems like ext3, ext4 or btrfs, but not Windows FAT. However it is possible to create hardlinks on a NTFS partition mounted in Linux.
[^2]: In `vi`, use `:set noexpandtab` to insert tabs instead of spaces.
[^3]: Curent versions of rsnapshot recommend the use of `retain` instead of `interval`.


