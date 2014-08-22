---
layout: post
title: A puppetized PostgreSQL on Vagrant
description: "This article shows how to install PostgreSQL inside a Vagrant box, conventiently bootstrapped with a Puppet module."
category: articles
tags: [vagrant, puppet, postgresql]
image:
  feature: vagrant-puppet-postgres-header.png
  credit: logos from their websites
---

__This article walks you through the setup of a PostgreSQL server inside a virtual box managed by Vagrant.__

We're using a Puppet module to bootstrap all the necessary stuff inside the base VM. Most of the steps should be the same for other services provided by good Puppet modules. The bird's-eye view of our endeavour:

1. install Vagrant and VirtualBox
2. initialize a CentOS base box
3. set up Puppet on that box
4. provision the latest Postgres version

__Why?__ What's the the rationale for this setup? Mitchell Hashimoto, creator of Vagrant, succinctly describes the intended purpose in [The Tao of Vagrant](http://mitchellh.com/the-tao-of-vagrant):

> In a world with Vagrant, developers can check out any repository from version control, run __vagrant up__, and have a fully running development environment without any human interaction. Developers continue to work on their own machine, in the comfort of their own editors, browsers, and other tools. The existence of Vagrant is transparent and unimportant in the mind of the developer. Vagrant is the workhorse that creates consistent and stable development environments.


The foundation
--------------

Now we're curious. What do we need to install to experience the joy of Vagrant first-hand?

* VirtualBox
* Vagrant

This description from the [Vagrant Docs](http://docs.vagrantup.com/v2/why-vagrant/index.html) give us some insight into the inner workings and why VirtualBox is needed:

> To achieve its magic, Vagrant stands on the shoulders of giants. Machines are provisioned on top of VirtualBox, VMware, AWS, or any other provider. Then, industry-standard provisioning tools such as shell scripts, Chef, or Puppet, can be used to automatically install and configure software on the machine.

### Installation

Ok, let's do this! We'll be using the awesome [Homebrew Cask](http://caskroom.io) to install Vagrant and VirtualBox[^1]. 

> Homebrew Cask extends Homebrew and brings its elegance, simplicity, and speed to OS X applications and large binaries alike.

Managing your common OSX apps (at least those outside of the App Store) is a breeze. Take a look:

{% highlight bash %}
# all casks it currently knows of
% brew cask search | wc -l
    1788

# as an example: install Google Chrome
% brew cask install google-chrome
{% endhighlight %}

Wait, let's not get carried away and focus on the task at hand: installing Vagrant:

{% highlight bash %}
% brew cask install vagrant
==> Downloading https://dl.bintray.com/mitchellh/vagrant/vagrant_1.6.3.dmg
######################################################################## 100,0%
==> Running installer for vagrant; your password may be necessary.
Password:
==> installer: Package name is Vagrant
==> installer: Installing at base path /
==> installer: The install was successful.
🍺  vagrant installed to '/opt/homebrew-cask/Caskroom/vagrant/1.6.3' (6 files, 78M)
{% endhighlight %}

The same for [VirtualBox](https://www.virtualbox.org), the default [Vagrant provider](http://docs.vagrantup.com/v2/providers/). As we learned, VirtualBox is basically the backend while Vagrant is the frontend we use from now on.

{% highlight bash %}
% brew cask install virtualbox
==> Downloading http://download.virtualbox.org/virtualbox/4.3.14/VirtualBox-4.3.14-95030-OSX.dmg
######################################################################## 100,0%
==> Running installer for virtualbox; your password may be necessary.
==> installer: Package name is Oracle VM VirtualBox
==> installer: Installing at base path /
==> installer: The install was successful.
🍺  virtualbox installed to '/opt/homebrew-cask/Caskroom/virtualbox/4.3.14-95030' (4 files, 117M)
{% endhighlight %}

Typing `vagrant` should yield the help of its subcommands.


Vagrant
-------

The easiest way to get started with Vagrant is by grabbing a ready-made box from the [Vagrant Cloud](https://vagrantcloud.com/discover/featured). These are free virtual machines we can use to initialize the development environment we want.

The [Getting Started section](http://docs.vagrantup.com/v2/getting-started/index.html) shows how simple this is. We want a system based on CentOS, so we pick [the popular CentOS 6.5 box](https://vagrantcloud.com/chef/centos-6.5):

{% highlight bash %}
# initialize the box
% vagrant init chef/centos-6.5
A `Vagrantfile` has been placed in this directory. You are now
ready to `vagrant up` your first virtual environment! Please read
the comments in the Vagrantfile as well as documentation on
`vagrantup.com` for more information on using Vagrant.
{% endhighlight %}

Ok, let's see how Vagrant does its magic.

{% highlight bash %}
% vagrant up
Bringing machine 'default' up with 'virtualbox' provider...
==> default: Box 'chef/centos-6.5' could not be found. Attempting to find and install...
    default: Box Provider: virtualbox
    default: Box Version: >= 0
==> default: Loading metadata for box 'chef/centos-6.5'
    default: URL: https://vagrantcloud.com/chef/centos-6.5
==> default: Adding box 'chef/centos-6.5' (v1.0.0) for provider: virtualbox
    default: Downloading: https://vagrantcloud.com/chef/centos-6.5/version/1/provider/virtualbox.box
==> default: Successfully added box 'chef/centos-6.5' (v1.0.0) for 'virtualbox'!
==> default: Importing base box 'chef/centos-6.5'...
==> default: Matching MAC address for NAT networking...
==> default: Checking if box 'chef/centos-6.5' is up to date...
==> default: Setting the name of the VM: centos65_default_1407782121141_28168
==> default: Clearing any previously set network interfaces...
==> default: Preparing network interfaces based on configuration...
    default: Adapter 1: nat
==> default: Forwarding ports...
    default: 22 => 2222 (adapter 1)
==> default: Booting VM...
==> default: Waiting for machine to boot. This may take a few minutes...
    default: SSH address: 127.0.0.1:2222
    default: SSH username: vagrant
    default: SSH auth method: private key
    default: Warning: Connection timeout. Retrying...
    default: Warning: Remote connection disconnect. Retrying...
==> default: Machine booted and ready!
==> default: Checking for guest additions in VM...
==> default: Mounting shared folders...
    default: /vagrant => /Users/sven/Code/boxes/centos6.5
{% endhighlight %}

You'll see a lot of things happening:

* download of the CentOS box
* configure port forwarding
* set up SSH access
* mount a shared folder

Quite remarkable! These two lines give us a working CentOS box with SSH access. Go ahead and try it with `vagrant ssh`. The directory `/vagrant` is a [shared folder](http://docs.vagrantup.com/v2/synced-folders/index.html), synced to our host machine.

So, `vagrant init` created a [Vagrantfile](http://docs.vagrantup.com/v2/vagrantfile/index.html), and `vagrant up` __repeatably__ sets everything up based on that. Usually you'd put the Vagrantfile in your `git` repo, enabling contributors to clone the project and get up and running with a simple `vagrant up`. Sweet!


Provisioning with Puppet
------------------------

Now let's take a look at the [provisioning capabilities of Vagrant](http://docs.vagrantup.com/v2/provisioning/index.html). Sure, we could manually install everything--via `vagrant ssh`--directly on our base box, but then we (and our kind contributors!) would lose the ability to clone the project in the future and automagically set up everything.

> Provisioners in Vagrant allow you to automatically install software, alter configurations, and more on the machine as part of the `vagrant up` process.

This sets the stage for [Puppet](https://docs.puppetlabs.com), the configuration management system of our choice for this project[^2].

### The bare minimum

We need to add the Puppet provisioner to our Vagrantfile:

{% highlight ruby %}
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Our Vagrant box.
  config.vm.box = "chef/centos-6.5"

  # Run `puppet apply` using site.pp.
  config.vm.provision "puppet" do |puppet|
    puppet.manifests_path = "manifests"
    puppet.manifest_file  = "site.pp"
  end
end
{% endhighlight %}

We just defined the file structure for Puppet, which we now create:

{% highlight bash %}
% mkdir manifests
% touch manifests/site.pp
% tree
.
|-- manifests
|   |-- site.pp
{% endhighlight %}

Our `site.pp` contains the following file resource, just to see if everything works. This should create the file `/tmp/tyler` with familiar content:

{% highlight puppet %}
# manifests/site.pp 
file { '/tmp/tyler':
  ensure  => present,
  content => 'The things you own end up owning you.',
}
{% endhighlight %}

Go ahead and `vagrant provision`. What's going to happen?

{% highlight bash %}
% vagrant provision
==> default: Running provisioner: puppet...
The `puppet` binary appears not to be in the PATH of the guest. This
could be because the PATH is not properly setup or perhaps Puppet is not
installed on this guest. Puppet provisioning can not continue without
Puppet properly installed.
{% endhighlight %}

Eh, that was to be expected. Our base box doesn't even include the `puppet` toolset, so in order to provision we have to install Puppet first.


### Install Puppet

Mitchell Hashimoto provides [a script exactly for that](https://github.com/hashicorp/puppet-bootstrap), so let's use that.

{% highlight bash %}
# create a scripts directory
mkdir scripts && cd $_

# grab the bootstrap script
curl -O https://raw.githubusercontent.com/hashicorp/puppet-bootstrap/master/centos_6_x.sh
cd ..
{% endhighlight %}

We add a `shell` provider which runs the [`centos_6_x.sh` script](https://github.com/hashicorp/puppet-bootstrap/blob/master/centos_6_x.sh) from the puppet-bootstrap repo. Put this above our `puppet` provisioner in the Vagrantfile.

{% highlight ruby %}
# puppet-bootstrap
config.vm.provision "shell", path: "scripts/centos_6_x.sh"
{% endhighlight %}

And `vagrant provsion`:

    % vagrant provision
    Running provisioner: shell...
    Running: /var/folders/dr/1j4r2y9509s58g6s6h9pm_hm0000gn/T/vagrant-shell20140817-18728-7v35dc.sh
    Configuring PuppetLabs repo...
    warning: 
    /tmp/tmp.umNmtlfQOB: Header V4 RSA/SHA1 Signature, key ID 4bd6ec30: NOKEY
    Installing puppet
    warning: 
    rpmts_HdrFromFdno: Header V3 RSA/SHA1 Signature, key ID c105b9de: NOKEY
    Importing GPG key 0xC105B9DE:
     Userid : CentOS-6 Key (CentOS 6 Official Signing Key) <centos-6-key@centos.org>
     Package: centos-release-6-5.el6.centos.11.1.x86_64 (@anaconda-CentOS-201311272149.x86_64/6.5)
     From   : /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-6
    warning: 
    rpmts_HdrFromFdno: Header V4 RSA/SHA512 Signature, key ID 4bd6ec30: NOKEY
    Importing GPG key 0x4BD6EC30:
     Userid : Puppet Labs Release Key (Puppet Labs Release Key) <info@puppetlabs.com>
     Package: puppetlabs-release-6-10.noarch (installed)
     From   : /etc/pki/rpm-gpg/RPM-GPG-KEY-puppetlabs
    Warning: RPMDB altered outside of yum.
    Puppet installed!
    Running provisioner: puppet...
    Running Puppet with site.pp...
    Warning: Setting manifestdir is deprecated. See http://links.puppetlabs.com/env-settings-deprecations
       (at /usr/lib/ruby/site_ruby/1.8/puppet/settings.rb:1095:in `issue_deprecations')
    Notice: Compiled catalog for localhost in environment production in 0.05 seconds
    Notice: /Stage[main]/Main/File[/tmp/tyler]/ensure: created
    Notice: Finished catalog run in 0.02 seconds

Excellent! We've installed Puppet and applied the "configuration" from our `site.pp` manifest. What about our test file?

{% highlight bash %}
# the file resource defined in site.pp
% vagrant ssh -c 'cat /tmp/tyler'
The things you own end up owning you.Connection to 127.0.0.1 closed.
{% endhighlight %}

Good job, we proved that our Puppet provisioner is working.


puppetlabs-postgresql
---------------------

The [puppetlabs-postgresql module](https://github.com/puppetlabs/puppetlabs-postgresql) is a one-stop shop, covering:

- package/service/configuration files for PostgreSQL
- listened-to ports
- system firewall (optional)
- IP and mask (optional)

### Module Setup

To include `puppetlabs-postgresql`, we can't simply clone the Github repo and be done with it, because we would miss all its module dependencies. The [Puppetforge page](https://forge.puppetlabs.com/puppetlabs/postgresql) lists four modules in the tab __Dependencies__.

We're using the handy `puppet module` tool included in the Puppet toolset to fetch all this stuff with one command. If Puppet isn't already on your system, install it. I'm taking shortcuts here and use the Rubygems version:

{% highlight bash %}
% gem install puppet
{% endhighlight %}

Note that we won't use _that_ Puppet binary to bootstrap our box. Vagrant has all its provisioning tools included. We just use it to conventiently grab the `puppetlabs-postgresql` module:

{% highlight bash %}
# that's where we put our pupet modules
% mkdir modules

# install puppetlabs-postgresql and all its dependencies
% puppet module install puppetlabs-postgresql --modulepath modules/
Notice: Preparing to install into /Users/sven/Code/boxes/centos6.5/modules ...
Notice: Downloading from https://forgeapi.puppetlabs.com ...
Notice: Installing -- do not interrupt ...
/Users/sven/Code/boxes/centos6.5/modules
└─┬ puppetlabs-postgresql (v3.4.2)
  ├── puppetlabs-apt (v1.6.0)
  ├── puppetlabs-concat (v1.1.0)
  ├── puppetlabs-firewall (v1.1.3)
  └── puppetlabs-stdlib (v4.3.2)
{% endhighlight %}

Now we tell our Puppet provisioner where to find the modules.

{% highlight ruby %}
# the config block for Puppet provisioning in our Vagrantfile
config.vm.provision "puppet" do |puppet|
  puppet.manifests_path = "manifests"
  puppet.manifest_file  = "site.pp"

  puppet.module_path = "modules"
end
{% endhighlight %}


### Manifest Definitions

Let's take a moment to think about our requirements. We want:

- a running PostgreSQL 9.3 server/cluster
- a new database and a user
- with the ability to connect from our host system (our trusty Mac)

Protip: [`puppetlabs-postgresql` reference](https://github.com/puppetlabs/puppetlabs-postgresql#reference) is always handy while we implement these requirements.


#### Postgres Server

The Puppet class `postgresql::server` is our first (and main) entry point. [According to the server docs on Github](https://github.com/puppetlabs/puppetlabs-postgresql#configuring-the-server), that's the API to define everything related to server installation and its security configuration.

As we want the new and shiny 9.3 release, we're going to use `postgresql::globals` to explicitly set the version (as 9.2 is the default). In `site.pp`, we add the following classes:

* [`postgresql::globals`](https://github.com/puppetlabs/puppetlabs-postgresql#class-postgresqlglobals) to override the `version`
* [`postgresql::server`](https://github.com/puppetlabs/puppetlabs-postgresql#class-postgresqlserver) to install and configure our Postgres cluster

{% highlight puppet %}
class { 'postgresql::globals':
  manage_package_repo => true,
  version             => '9.3',
} -> 
class { 'postgresql::server':
  listen_addresses  => '*',
  postgres_password => 'funkytown',
}
{% endhighlight %}

Note that the little arrow in the manifest tells Puppet about ordering. Anyway, we apply the Puppet manifest with `vagrant provision`, with the following output:

    Running provisioner: shell...
    Running: /var/folders/dr/1j4r2y9509s58g6s6h9pm_hm0000gn/T/vagrant-shell20140819-21247-o4dtl.sh
    Puppet is already installed.
    Running provisioner: puppet...
    Running Puppet with site.pp...
    Warning: Setting manifestdir is deprecated. See http://links.puppetlabs.com/env-settings-deprecations
       (at /usr/lib/ruby/site_ruby/1.8/puppet/settings.rb:1095:in `issue_deprecations')
    Warning: Config file /etc/puppet/hiera.yaml not found, using Hiera defaults
    Warning: Scope(Class[Postgresql::Server]): Passing "version" to postgresql::server is deprecated; please use postgresql::globals instead.
    Notice: Compiled catalog for localhost in environment production in 5.18 seconds
    Warning: The package type's allow_virtual parameter will be changing its default value from false to true in a future release. If you do not want to allow virtual packages, please explicitly set allow_virtual to false.
       (at /usr/lib/ruby/site_ruby/1.8/puppet/type.rb:816:in `set_default')
    Notice: /Stage[main]/Concat::Setup/File[/var/lib/puppet/concat]/ensure: created
    Notice: /Stage[main]/Concat::Setup/File[/var/lib/puppet/concat/bin]/ensure: created
    Notice: /Stage[main]/Concat::Setup/File[/var/lib/puppet/concat/bin/concatfragments.sh]/ensure: defined content as '{md5}7bbe7c5fce25a5ddd20415d909ba44fc'
    Notice: /Stage[main]/Postgresql::Repo::Yum_postgresql_org/File[/etc/pki/rpm-gpg/RPM-GPG-KEY-PGDG-93]/ensure: defined content as '{md5}78b5db170d33f80ad5a47863a7476b22'
    Notice: /Stage[main]/Postgresql::Client/File[/usr/local/bin/validate_postgresql_connection.sh]/ensure: defined content as '{md5}20301932819f035492a30880f5bf335a'
    Notice: /Stage[main]/Postgresql::Repo::Yum_postgresql_org/Yumrepo[yum.postgresql.org]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Install/Package[postgresql-server]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Initdb/Exec[postgresql_initdb]/returns: executed successfully
    Notice: /Stage[main]/Postgresql::Server::Config/File[/etc/sysconfig/pgsql/postgresql]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments.concat.out]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments.concat]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[local access as postgres user]/Concat::Fragment[pg_hba_rule_local access as postgres user]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/001_pg_hba_rule_local access as postgres user]/ensure: defined content as '{md5}03454101c43efbcdecc71dd3f734a68f'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[allow localhost TCP access to postgresql user]/Concat::Fragment[pg_hba_rule_allow localhost TCP access to postgresql user]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/003_pg_hba_rule_allow localhost TCP access to postgresql user]/ensure: defined content as '{md5}f30c1a00a0759236b37352c32cd0e284'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[allow access to all users]/Concat::Fragment[pg_hba_rule_allow access to all users]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/100_pg_hba_rule_allow access to all users]/ensure: defined content as '{md5}0c5966ab4591f092ef66ce333bb3f463'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[deny access to postgresql user]/Concat::Fragment[pg_hba_rule_deny access to postgresql user]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/004_pg_hba_rule_deny access to postgresql user]/ensure: defined content as '{md5}205b04b3328583b8330f59e37d55c8e8'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[local access to database with same name]/Concat::Fragment[pg_hba_rule_local access to database with same name]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/002_pg_hba_rule_local access to database with same name]/ensure: defined content as '{md5}61275db6b21adbf53b575d4c1a6bbed1'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Config_entry[listen_addresses]/Postgresql_conf[listen_addresses]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Pg_hba_rule[allow access to ipv6 localhost]/Concat::Fragment[pg_hba_rule_allow access to ipv6 localhost]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/101_pg_hba_rule_allow access to ipv6 localhost]/ensure: defined content as '{md5}ab588822a007943223faadf86be3044a'
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/Exec[concat_/var/lib/pgsql/9.3/data/pg_hba.conf]/returns: executed successfully
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/Exec[concat_/var/lib/pgsql/9.3/data/pg_hba.conf]: Triggered 'refresh' from 8 events
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/pgsql/9.3/data/pg_hba.conf]/content: content changed '{md5}9784211d3c0e7ad5a539b9dcb964b9c3' to '{md5}c31ee6f98ede22591533e8056938c902'
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/pgsql/9.3/data/pg_hba.conf]/mode: mode changed '0600' to '0640'
    Notice: /File[/var/lib/pgsql/9.3/data/pg_hba.conf]/seluser: seluser changed 'unconfined_u' to 'system_u'
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Config_entry[port]/Postgresql_conf[port]/ensure: created
    Notice: /Stage[main]/Postgresql::Server::Config/Postgresql::Server::Config_entry[port]/Augeas[override PGPORT in /etc/sysconfig/pgsql/postgresql]/returns: executed successfully
    Notice: /Stage[main]/Postgresql::Server::Service/Anchor[postgresql::server::service::begin]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Postgresql::Server::Service/Service[postgresqld]/ensure: ensure changed 'stopped' to 'running'
    Notice: /Stage[main]/Postgresql::Server::Service/Postgresql::Validate_db_connection[validate_service_is_running]/Exec[validate postgres connection for /postgres]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Postgresql::Server::Service/Anchor[postgresql::server::service::end]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Postgresql::Server::Reload/Exec[postgresql_reload]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Postgresql::Server::Passwd/Exec[set_postgres_postgrespw]/returns: ALTER ROLE
    Notice: /Stage[main]/Postgresql::Server::Passwd/Exec[set_postgres_postgrespw]/returns: executed successfully
    Notice: Finished catalog run in 25.07 seconds


Lot's of things happened here. If you're proficient in interpreting Puppet output, you'll recognize:

* the yum.postgresql.org repo for 9.3 releases
* Postgres RPM installation, [`initdb`](http://www.postgresql.org/docs/9.3/interactive/app-initdb.html)
* some [`pg_hba.conf`](http://www.postgresql.org/docs/9.3/static/auth-pg-hba-conf.html) rules
* our `postgresql.conf` settings

SSH to your box and take a quick look at the Postgres environment:

{% highlight bash %}
# switch to postgres, via root
[vagrant@localhost ~]$ su 
Passwort:  vagrant
[root@localhost vagrant]% su - postgres

# list databases
$ psql -l

# control postgres
$ service postgresql-9.3 status
postgresql-9.3 (pid  982) is running...
{% endhighlight %}

Yeah, now we're talking!

#### Database and user

How about an additional user and a database? Presto!

{% highlight puppet %}
# our database
postgresql::server::db { 'mydb':
  user     => 'funky',
  password => postgresql_password('funky', 'funkytown'),
}

# rule for remote connections
postgresql::server::pg_hba_rule { 'allow remote connections with password':
  type        => 'host',
  database    => 'all',
  user        => 'all',
  address     => 'all',
  auth_method => 'md5',
}
{% endhighlight %}

The relevant output snippet:

    Notice: /Stage[main]/Main/Postgresql::Server::Db[mydb]/Postgresql::Server::Database[mydb]/Postgresql_psql[Check for existence of db 'mydb']/command: command changed '' to 'SELECT 1'
    Notice: /Stage[main]/Main/Postgresql::Server::Db[mydb]/Postgresql::Server::Database[mydb]/Exec[/usr/pgsql-9.3/bin/createdb --port='5432' --owner='postgres' --template=template0  'mydb']: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Main/Postgresql::Server::Db[mydb]/Postgresql::Server::Database[mydb]/Postgresql_psql[REVOKE CONNECT ON DATABASE "mydb" FROM public]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Main/Postgresql::Server::Db[mydb]/Postgresql::Server::Role[funky]/Postgresql_psql[CREATE ROLE "funky" ENCRYPTED PASSWORD 'md5f4698923b38e59c65cf5fe2fa4415c4e' LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER  CONNECTION LIMIT -1]/command: command changed '' to 'CREATE ROLE "funky" ENCRYPTED PASSWORD 'md5f4698923b38e59c65cf5fe2fa4415c4e' LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER  CONNECTION LIMIT -1'
    Notice: /Stage[main]/Main/Postgresql::Server::Db[mydb]/Postgresql::Server::Database_grant[GRANT funky - ALL - mydb]/Postgresql::Server::Grant[database:GRANT funky - ALL - mydb]/Postgresql_psql[GRANT ALL ON DATABASE "mydb" TO "funky"]/command: command changed '' to 'GRANT ALL ON DATABASE "mydb" TO "funky"'
    Notice: /Stage[main]/Main/Postgresql::Server::Pg_hba_rule[allow remote connections with password]/Concat::Fragment[pg_hba_rule_allow remote connections with password]/File[/var/lib/puppet/concat/_var_lib_pgsql_9.3_data_pg_hba.conf/fragments/150_pg_hba_rule_allow remote connections with password]/ensure: defined content as '{md5}8cbe216bbf0015ae690bbc5fad401cef'
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/Exec[concat_/var/lib/pgsql/9.3/data/pg_hba.conf]/returns: executed successfully
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/Exec[concat_/var/lib/pgsql/9.3/data/pg_hba.conf]: Triggered 'refresh' from 1 events
    Notice: /Stage[main]/Postgresql::Server::Config/Concat[/var/lib/pgsql/9.3/data/pg_hba.conf]/File[/var/lib/pgsql/9.3/data/pg_hba.conf]/content: content changed '{md5}c31ee6f98ede22591533e8056938c902' to '{md5}8a250c9c74ba0eca31b91b9baab01ed4'
    Notice: /Stage[main]/Postgresql::Server::Reload/Exec[postgresql_reload]: Triggered 'refresh' from 1 events
    

The [`postgres::server::db` provider](https://github.com/puppetlabs/puppetlabs-postgresql#resource-postgresqlserverdb) checks if `mydb` is already present; then [`createdb`](http://www.postgresql.org/docs/9.3/static/app-createdb.html) is executed and user and permissions are configured. Access for user `funky` is granted via `pg_hba.conf`.


Port Forwarding
---------------

We missed one requirement: the ability to connect from our host machine to `mydb`. We want [Forwarded Ports](https://docs.vagrantup.com/v2/networking/forwarded_ports.html):

> Forwarded ports allow you to access a port on your host machine and have all data forwarded to a port on the guest machine, over either TCP or UDP.
> 
> For example: If the guest machine is running a web server listening on port 80, you can make a forwarded port mapping to port 8080 (or anything) on your host machine. You can then open your browser to `localhost:8080` and browse the website, while all actual network data is being sent to the guest.

What we have to do is forward the `PGPORT` 5432 of our cluster to port 15432 on our host[^3]. In our Vagrantfile:

{% highlight ruby %}
Vagrant.configure("2") do |config|
  config.vm.network "forwarded_port", guest: 5432, host: 15432
end
{% endhighlight %}

It's time for a [`vagrant reload`](https://docs.vagrantup.com/v2/cli/reload.html):

{% highlight bash %}
# 'vagrant halt' and 'up' box
% vagrant reload
{% endhighlight %}

Finally, we can login from our Mac with our favorite Postgres client. You could install pgAdmin3:

{% highlight bash %}
% brew cask install pgadmin3
{% endhighlight %}

Or you could use `psql` from a PostgreSQL version installed via homebrew, which works like this:

{% highlight bash %}
% psql -h localhost -p 15432 -U funky mydb
Password for user funky: 
psql (9.3.3, server 9.3.5)
Type "help" for help.

mydb=>
{% endhighlight %}



Summary
-------

What a ride! We initialized a CentOS box and provisioned Postgres via Puppet. Everyone should be capable of recreating our environment with a simple `git clone` and `vagrant up`.

You can try that based on the [__puppet-postgres-vagrant__](https://github.com/sohooo/puppet-postgres-vagrant) repo, which is the result of our great journey. I'd be happy to hear about the improvements/suggestions you've got, so just shoot a mail at <a href="mailto:hi@intothespirit.com" class="mail">hi@intothespirit.com</a>.


Resources
---------

As a bonus, here's a list of awesome resources and tips from Vagrant-land:

* O'Reilly: [Vagrant: Up and Running](http://amzn.to/1ti1554) (Mitchell Hashimoto)
* Set up [NFS Shared Folders](https://docs.vagrantup.com/v2/synced-folders/nfs.html) to speed up Vagrant ([Guide](https://coderwall.com/p/uaohzg), [filesystem performance comparison](http://mitchellh.com/comparing-filesystem-performance-in-virtual-machines) from Mitchell)
* [`vagrant package`](https://docs.vagrantup.com/v2/cli/package.html) to turn a currently running VirtualBox environment into a re-usable box.
* [veewee](https://github.com/jedi4ever/veewee), the powerful VM builder for VirtualBox, VMWare, KVM. _"Veewee aims to automate all the steps for building base boxes and to collect best practices in a transparent way."_
* [Puppet Vagrant Boxes](http://puppet-vagrant-boxes.puppetlabs.com): _"Pre-rolled vagrant boxes, ready for use ... made by the folks at Puppet Labs"_
* Vagrant plugin [`vagrant-vbguest`](https://github.com/dotless-de/vagrant-vbguest) keeps the [VirtualBox Guest Additions](https://www.virtualbox.org/manual/ch04.html) up to date.
* Plugin [`vagrant-hostsupdater`](https://github.com/cogitatio/vagrant-hostsupdater) adds an entry to your `/etc/hosts` file on the host system.
*  Plugin [`vagrant-cachier`](https://github.com/fgrehm/vagrant-cachier) for neat caching of boxes and packages [(docs)](http://fgrehm.viewdocs.io/vagrant-cachier).

_**Happy provisioning!**_





[^1]: The installation mechanism doesn't matter of course. You can always download the packages of [Vagrant](https://www.vagrantup.com/downloads.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads) to prepare your system.
[^2]: There are lots of different providers to choose from: [Chef](https://docs.vagrantup.com/v2/provisioning/chef_solo.html), [Salt](https://docs.vagrantup.com/v2/provisioning/salt.html) and the shiny new [Docker](https://docs.vagrantup.com/v2/provisioning/docker.html) provisioner are just some of them.
[^3]: We could add the parameter `auto_correct: true` to prevent port collisions. More in [the docs](https://docs.vagrantup.com/v2/networking/forwarded_ports.html).
