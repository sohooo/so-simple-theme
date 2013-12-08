---
layout: post
title: Blogging with Jekyll
description: "Bootstrap a Jekyll blog with an awesome theme, with just a few config changes"
category: articles
tags: [jekyll, blogging]
---

This post describes probably the fastest way to set up a decent looking [Jekyll blog](http://jekyllrb.com). We use the [So Simple theme](https://github.com/mmistakes/so-simple-theme/fork) as a foundation and throw in some customization. Ready?


Setup
-----

Follow the instructions on the [Theme Setup]({% post_url 2013-09-11-theme-setup %}) post included in the theme. The command `jekyll serve --watch` should preview the site for you on [localhost:4000](http://localhost:4000).


Structure
---------

### Drafts

After you're done personalizing your `_config.yml`, it's time to prepare the blog to host your content. First, I recommend using the [drafts feature](http://jekyllrb.com/docs/drafts/). This way you can locally preview posts you're working on (without a date). You can also convert the sample posts of the theme to drafts.

For drafts, create the directory `_drafts` in your site root, and put your markdown posts in there:

~~~ bash
|-- _drafts/
|   |-- a-draft-post.md
~~~

The `jekyll --serve` preview assigns the modification time as `date`.

### Rake Tasks

The Rake tasks I describe in the following sections are structured like this:

~~~ bash
Rakefile
|-- _tasks/
|   |-- icons.rake
|   |-- utils.rake
~~~

The `Rakefile` loads all tasks:

~~~ ruby
# Load custom rake scripts
Dir['_tasks/*.rake'].each { |r| load r }
~~~

Favicons
--------

Managing all the different favicon formats can be a pain in the ass, and that's why we automate it. I created a rake task which uses the [favicon_maker gem](https://github.com/follmann/favicon_maker):

> The basic idea is to have one image file as source for all the different sizes and/or formats (png/ico).

[Here's the code](https://github.com/sohooo/so-simple-theme/blob/master/_tasks/icons.rake):

~~~ ruby
require 'favicon_maker'

desc 'generate favicons based on avatar.png'
task :icons do
  options = {
    :root_dir => File.expand_path('../..', __FILE__),
    :base_image => "avatar.png",
    :input_dir => "images",
    :output_dir => "images"
  }
  FaviconMaker::Generator.create_versions(options) do |filepath|
    puts "Created favicon: #{filepath}"
  end
end
~~~


Build & Deploy
--------------

If you intend to use the `site.url` variable in your URLs, you're in for some pain. The variable is defined in `_config.yml` as `url: http://localhost:4000`. When `jekyll build`ing your site, this will result in URLs prefixed with `localhost`. However, it's also inconvenient to set your deploy URL, as this will prevent you from previewing your site locally.

__The solution__: another rake task :) [My current one](https://github.com/sohooo/so-simple-theme/blob/master/_tasks/utils.rake) is a slightly modified version of __avillafiorita__'s [awesome collection of tasks](https://github.com/avillafiorita/jekyll-rakefile).

This rake file allows you to define `$deploy_url` and `$deploy_dir`. Now, previewing (`rake preview`) and building your site (`rake build`) swaps the `url` parameter in `_config.yml` as you need it.


Customizing
-----------

If you want to change stylesheets and JavaScript files, [install Node.js](http://nodejs.org/), then [install Grunt](http://gruntjs.com/getting-started), and then finally install the dependencies for the theme contained in `package.json` with `npm install`. Now you can minify CSS, concatenate JavaScript and other useful things with `grunt [watch]`.

In order to use both the Jekyll and Grunt watcher, I created [a simple Procfile](https://github.com/sohooo/so-simple-theme/blob/master/Procfile) for [foreman](http://ddollar.github.io/foreman/):

~~~ bash
# Procfile
jekyll: jekyll serve --watch --drafts
grunt: grunt watch
~~~

Now, [my `rake preview` task](https://github.com/sohooo/so-simple-theme/blob/master/_tasks/utils.rake#L15-18) starts both Jekyll and Grunt, watching for every possible change.

---

If you want to comment on this post or if you have other useful additions for a Jekyll blog, just shoot a mail at <a href="mailto:hi@intothespirit.com" class="mail">hi@intothespirit.com</a>.
