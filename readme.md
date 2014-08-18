This code uses a threshold method to find the smallest possible edge length that can result in a perfect matching between sources and destinations. It uses a binary search to find this threshold length, repeatedly checking the median value between the current upper and lower bounds to see if that threshold is feasible. It determines this by using the Hopcroft–Karp algorithm to generate a maximum size matching, then checks to see if that matching is perfect (successfully connects all sources and destinations). Once the lowest threshold is found, the best matching is returned as an array that maps source indicies to destination indicies.

There are two methods provided here:
* `lbap(matrix)` computes the best matching given a cost matrix, where `matrix[i][j]` is the distance from source i to destination j.
* `lbap_pairs(sources,dests,distfn)` is a utility function that computes the best matching from sources to dests (which must be the same size). It generates a matrix by passing each source-destination pair to the provided `distfn` and using the returned results. (For example, if you passed arrays of `{x:number,y:number}` as sources and dests and `function(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}`, it would generate the cost matrix using taxicab distance between the points.

There may be multiple perfect matchings for a given threshold. This algorithm does not try to find the "best" one, instead simply using the first one it finds. However, it intentionally tries to find solutions that use zero-cost edges first if they exist, so the final result will usually have as many zero-cost edges in it as possible.

lbap.js outputs to the console to show how it computes the best matching. lbap-silent.js runs silently, and lbap.min.js is minified for production use.

This code depends on [Underscore.js](http://underscorejs.org/) and Stephen Morley's [Queue.js](http://code.stephenmorley.org/javascript/queues/).

- - -

Copyright 2014 Daniel Johnson.

This code is released under the MIT license and may be freely distributed under that license.