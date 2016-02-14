---
layout: post
title: "Quickly try a Swift library"
description: "Try an iOS library in a playground, all with the new pod plugin"
category: articles
tags: [swift, ios, pod, playground]
image:
  feature: articles/swift/swift-logo-hero.jpg
  credit: http://apple.com/swift/
---

A new CocoaPods plugin called [playgrounds](https://github.com/neonichu/ThisCouldBeUsButYouPlaying) allows you to quickly create a playground for a specific pod library. This helps to quickly get a feel for it before you drag another dependency in your iOS project.


# Setup

First we need to install the plugin:

{% highlight bash %}
% gem install cocoapods-playgrounds
Fetching: cocoapods-playgrounds-0.0.2.gem (100%)
Successfully installed cocoapods-playgrounds-0.0.2

# make sure you've got a fresh pod version
% pod --version
0.39.0
{% endhighlight %}


# Scale

Now let's try [Scale](https://github.com/onmyway133/Scale), a unit conversion library for swift. First, we create our pod-specific playground:

{% highlight bash %}
% pod playgrounds Scale
{% endhighlight %}

This should open *ScalePlayground* in XCode. After building the `Scale` scheme, we can go ahead and open `Scale/Scale.playground` to try this shiny library!

{% highlight ruby %}
//: Please build the scheme 'ScalePlayground' first
import XCPlayground
XCPlaygroundPage.currentPage.needsIndefiniteExecution = true

import Scale

let length = 5.kilometer + 7.meter  // 5007 meter
let weight = 10.0.kilogram * 5.gram // 50000 gram
{% endhighlight %}


*Happy playing!*
