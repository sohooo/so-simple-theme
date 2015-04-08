---
layout: post
title: Quickstart your webapp
description: "A fast and convenient way to get started with developing your next awesome web project."
category: articles
tags: [yeoman, bower, grunt, bootstrap]
image:
  feature: articles/webapp/yeoman.jpg
  credit: http://addyosmani.com
---

There are myriads of [JavaScript frameworks](https://github.com/showcases/front-end-javascript-frameworks) and [libraries](http://microjs.com/) out there, and as every ambitious web developer eager for knowledge to soak up, you want to test them all.

Maybe the new shiny one just mentioned on [Hacker News](https://news.ycombinator.com) is exactly what the doctor ordered for your next project? Yeah, that's you.

What we need is a fast and convenient way to get started. We want a basic website structure which doesn't hurt our eyes. [Coffeescript](http://coffeescript.org) and [Sass](http://sass-lang.com) should be wired up, and changes should be visible immediately. Enter the *Yeoman workflow*.


# The Yeoman workflow

> Yeoman helps you kickstart new projects, prescribing best practices and tools to help you stay productive.
>
> To do so, we provide a generator ecosystem. A generator is basically a plugin that can be run with the `yo` command to scaffold complete projects or useful parts.

So basically we'll use __Yeoman__ to bootstrap our environment with the features implemented by one of its generators. The rest (e.g. third-party dependencies) is the domain of __Bower__ and __Grunt__.

<figure>
  <a href="{{site.url}}/images/articles/webapp/yeoman-workflow.jpg"><img src="{{site.url}}/images/articles/webapp/yeoman-workflow.jpg"></a>
  <figcaption><a href="http://yeoman.io/learning/" title="The Yeoman Workflow">Each of these projects are independently maintained by their respective communities, but work well together as a part of a prescriptive workflow for keeping you effective -- yeoman.io</a>.</figcaption>
</figure>

[Yeoman](http://yeoman.io/) is distributed via the Node.js package manager `npm`, so step 0 is to [set up npm first](http://thechangelog.com/install-node-js-with-homebrew-on-os-x/). Then, the [Yeoman setup](http://yeoman.io/learning/) is simply:

{% highlight bash %}
# The  --global argument will cause npm to install the package globally
# rather than locally. This means 'yo' is available in every directory.
% npm install -g yo
% yo -v
1.3.3
{% endhighlight %}

If we run `yo` without arguments, a nice interface presents us options to run a generator shipped with Yeoman or install new ones. Now, we focus on the most famous Yeoman generator for web apps.

# generator-webapp

Yeoman's  [generator-webapp](https://github.com/yeoman/generator-webapp)  scaffolds out a front-end web app, with all the features we want (and more). The Github page lists:

- CSS Autoprefixing
- Built-in preview server with LiveReload
- Automagically compile CoffeeScript & Sass
- Automagically lint your scripts
- Automagically wire up your Bower components with grunt-wiredep.
- Awesome Image Optimization (via OptiPNG, pngquant, jpegtran and gifsicle)
- Mocha Unit Testing with PhantomJS
- Bootstrap for Sass (Optional)
- Leaner Modernizr builds (Optional)


## Setup

To get started, we install the generator and invoke it with `yo`:

{% highlight bash %}
# install the generator
% npm install -g generator-webapp

# a place for our webapp project
% mkdir webapp && cd $_

# generate structure, with Coffeescript support
yo webapp --coffee
{% endhighlight %}

[The friendly generator](https://github.com/yeoman/generator-webapp/blob/master/readme.md) includes [HTML5 Boilerplate](http://html5boilerplate.com), [jQuery](https://jquery.com) and a [Gruntfile](http://gruntjs.com/sample-gruntfile). Additionally, we opt to include Sass in the menu. After the intimidatingly long list of components has been installed, we can look at the result.

Fire up the webapp with:

{% highlight bash %}
grunt serve
{% endhighlight %}

Your default browser should open Yeoman's welcome page (*'Allo, 'Allo!*), always up to date thanks to LiveReload. The browser console should show `'Allo from CoffeeScript!`. If you get a Ruby Sass error, install the missing gem with `gem install sass`.

## Webapp structure

The files of our webapp are neatly structured in the `app/` directory.

    ▾ app/
      ▾ images/
      ▾ scripts/
          main.js
      ▾ styles/
          main.scss
        favicon.ico
        index.html
        robots.txt

Go ahead, open `app/index.hml` and change the `<h1>` gretting. Saving the file should result in an immediate update in the browser.


## Third-Party Dependencies

Third-party dependencies are managed with [grunt-wiredep](https://github.com/stephenplusplus/grunt-wiredep). The bower-grunt duo removes the chore to manually download, say, jQuery, place it in the correct directory and link it in `index.html`. The same with updates.

How about this:

{% highlight bash %}
bower install --save jquery
grunt wiredep
{% endhighlight %}

Because jQuery--together with a lot of other projects--follows the [Bower spec](https://github.com/bower/bower.json-spec), the library is wired up in  `index.html` like this:

{% highlight html %}
<!-- bower:js -->
<script src="bower_components/jquery/jquery.js"></script>
<!-- endbower -->
{% endhighlight %}

If this doesn't work with the bower project you want to try, you can always manually add the dependency (the `<script>` or `<style` tag) by yourself.

## An example workflow

Let's try the Yeoman workflow to check out [marka](http://fian.my.id/marka/):

> Beautiful transformable icons built for the web.

{% highlight bash %}
# our project dir
% mkdir marka && cd $_

# scaffold the webapp, without coffeescript this time
yo webapp

# let's see if we can find a bower package for 'marka'
bower search marka

# yup, install it! Don't forget '--save'
bower install --save marka
grunt wiredep
{% endhighlight %}

`bower list` shows the dependencies it currently knows of:

{% highlight bash %}
marka /Users/sven/Code/marka
├─┬ bootstrap#3.2.0 (latest is 3.3.1)
│ └── jquery#2.1.1
└── marka#0.3.1
{% endhighlight %}

### Changes

Everything should be ready now to [start playing around](http://fian.my.id/marka/getting-started.html) with Marka. I changed these files:

- `index.html` to include test icon
- `app/scripts/main.js` to initialize icon and change on click
- `.jshintrc` to suppress linting warnings

{% highlight html %}
<!-- index.html -->
<i id="icon"></i>
{% endhighlight %}

{% highlight js %}
// app/scripts/main.js
$(document).ready(function() {
  'use strict';

  var m = new Marka('#icon');
  m.set('circle')
    .color('#00B4FF')
    .size('100');

  $('#icon').click(function(){
    m.set('plus');
  });

});
{% endhighlight %}

To make the `jshint` task happy, I included the following in `.jshintrc`:

{% highlight js %}
  ...
  "globals" : {
    "Marka": false
  }
{% endhighlight %}

<figure>
  <a href="{{site.url}}/images/articles/webapp/marka-screenshot.png"><img src="{{site.url}}/images/articles/webapp/marka-screenshot.png"></a>
  <figcaption>The Marka icon inserted into the bootstrapped site, ready for more awesome stuff.</figcaption>
</figure>

## Conclusion

This article showed a quick way how to bootstrap a modern web app. Some highlights:

- one-command bootstrap of webapp (generator-webapp)
- LiveReload functionality to watch what we're doing
- dependency management with bower and grunt-wiredep

And this is far from all. Lot's of grunt tasks we didn't even talk about (image optimization, file compression, ...) and other goodies however deserve another article.

*Happy bootstrapping!*


## Further resources

- [Tutorial](http://yeoman.io/codelab.html): build a simple todo app with Yeoman
- [Video: Getting started with Yeoman and generator-webapp](https://www.youtube.com/watch?v=zBt2g9ekiug) by the awesome Addy Osmani
