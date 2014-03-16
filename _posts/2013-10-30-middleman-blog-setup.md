---
layout: post
title: Middleman Blog Setup
description: "Get starting with Middleman, the awesome static blogging engine"
category: articles
tags: [middleman, blogging]
---

Let's play with [Middleman](http://middlemanapp.com/), a Ruby framework for static website generation. There are a lot of useful [extensions](http://directory.middlemanapp.com/#/extensions/all). This post shows the installation and usage of the following:

* [blogging extension](http://middlemanapp.com/blogging/)
* [middleman-syntax](https://github.com/middleman/middleman-syntax) 

We're going to start with a brand new site structure based on the blogging template. The end result of our prototype shows the sample post with the capability to highlight the syntax of your code.
READMORE

Blogging
--------
The blogging extension offers support for, well, blogging, articles and tagging.

The installation is simple:

{% highlight bash %}
# install gem
gem install middleman-blog --no-document

# initialize new blog project
middleman init MY_BLOG_PROJECT --template=blog

# preview the blog
cd MY_BLOG_PROJECT
bundle exec middleman
{% endhighlight %}

Syntax Highlighting
-------------------

As noted above, `middleman-blog` is just one of the [many extensions](http://directory.middlemanapp.com/#/extensions/all) for Middleman. The following steps show the [setup](https://github.com/middleman/middleman-syntax) of the `middleman-syntax` extension for syntax-highlighted code.

{% highlight ruby %}
# add to Gemfile
gem "middleman-syntax"
{% endhighlight %}

Extensions need to be activated in the `config.ru` configuration file. Additional settings can be provided to support highlighted code in Markdown code blocks, similar to Github.

{% highlight ruby %}
# config.ru settings
activate :syntax
set :markdown_engine, :redcarpet
set :markdown, :fenced_code_blocks => true, :smartypants => true
{% endhighlight %}

The code blocks should now be wrapped in `pre class="highlight"` tags, but without some CSS, the code stays boring. We could provide any Pygments-compatible stylesheet, or let Rouge generate one of [its themes](https://github.com/jayferd/rouge/tree/master/lib/rouge/themes) by creating a file `stylesheets/syntax.css.erb` and adding:

{% highlight erb %}
<%= Rouge::Themes::ThankfulEyes.render(:scope => '.highlight') %>
{% endhighlight %}

We need to include that stylesheet in our `layout.erb`'s `<head>`:

{% highlight erb %}
<%= stylesheet_link_tag 'syntax' %>
{% endhighlight %}

The code should now be ablaze with colors.
