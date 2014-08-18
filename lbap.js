function lbap_pairs(sources, dests, distFn){
	var matrix = [];
	for (var i = sources.length - 1; i >= 0; i--) {
		var src = sources[i];
		matrix[i]=[];
		for (var j = dests.length - 1; j >= 0; j--) {
			var dest = dests[j];
			matrix[i][j] = distFn(src,dest);
		};
	};
	logMatrix(matrix);
	return lbap(matrix);
}
function lbap(C){
	function getMatching(thresh){
		console.groupCollapsed("Getting maximum matching for ",thresh);
		var sources = [];
		var dests = [];
		for (var i = 0; i < n; i++) {
			sources[i]={
				idx:i,
				adj:[],
				numIdentical:0,
				match:false
			};
			dests[i]={
				idx:i,
				adj:[],
				numIdentical:0,
				match:false
			};
		}
		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				if(C[i][j] <= thresh){
					var csource = sources[i];
					var cdest = dests[j];
					if(C[i][j]==0){
						csource.adj.push(csource.adj[csource.numIdentical]);
						cdest.adj.push(cdest.adj[cdest.numIdentical]);
						csource.adj[csource.numIdentical++] = cdest;
						cdest.adj[cdest.numIdentical++] = csource;
						console.log("Edge betw s"+i+" and d"+j+" is zero length!");

					}else{
						sources[i].adj.push(dests[j]);
						dests[j].adj.push(sources[i]);
						console.log("Edge betw s"+i+" and d"+j+" exists!");
					}
				}
			};
		};
		console.log("Beginning procedure");
		while(true){
			var sLabeled = new Array(n);
			var dLabeled = new Array(n);

			var sQueue = new Queue(), dQueue = new Queue();
			console.log(" Adding unmatched sources to queue...");
			_.each(sources,function(src,idx){
				if(!src.match){
					sQueue.enqueue(src);
					sLabeled[idx]=1;
					console.log("  Adding ",src," at level 1");
				}
			});
			var nLabel = 2;
			var shouldContinue = true;
			console.log(" Beginning breadth-first search");
			while(true){
				var found=[], cs, cd;
				console.log(" Searching source queue");
				if(sQueue.isEmpty()) console.log(" No unmatched sources! Nothing to search.");
				while(!sQueue.isEmpty()){
					cs = sQueue.dequeue();
					for (var i = cs.adj.length - 1; i >= 0; i--) {
						var nd = cs.adj[i];
						if(dLabeled[nd.idx]) continue;
						dLabeled[nd.idx]=nLabel;
						console.log("  Unlabeled dest ",nd,", labeled with level ",nLabel);
						dQueue.enqueue(nd);
						if(!nd.match){
							found.push(nd);
							console.log("  !!Found an unmatched dest! Best level is ",nLabel);
						}
					};
				}

				if(found.length==0){
					console.log(" No unmatched dests.")
					nLabel++;
					if(dQueue.isEmpty()){
						shouldContinue=false;
						console.log("No unlabeled dests! No more alternating matches possible. Matching is now maximal (and perfect if possible)");
						break;
					}
					console.log(" Proceed to the matched dests' sources");
					while(!dQueue.isEmpty()){
						cd = dQueue.dequeue();
						var ns = cd.match;
						sLabeled[ns.idx]=nLabel;
						console.log("  Unlabeled, matched (to d",cd.idx,") source ",ns,", labeled with level ",nLabel);
						sQueue.enqueue(ns);
					}
					nLabel++;
				}else{
					console.log(" Found ",found.length," alternating match(es)! Swap them in, then redo search");
					for (var i =  0; i < found.length; i++) {
						if(found[i].numIdentical == 0) continue;
						console.log("  Swapping from dest ",found[i]," (this dest has a zero-edge)");
						swapAlternatesDest(found[i].idx);
					};
					for (var i =  0; i < found.length; i++) {
						if(found[i].numIdentical != 0) continue;
						console.log("  Swapping from dest ",found[i]);
						swapAlternatesDest(found[i].idx);
					};
					break;

					function swapAlternatesDest(idx){
						console.log("    Dest Swapping from ",idx);
						var cd = dests[idx], label = dLabeled[idx];
						for (var i = 0; i < cd.adj.length; i++) {
							var ps = cd.adj[i];
							if(sLabeled[ps.idx]==label-1){
								console.group("    Possible alternate source ",ps);
								var success = swapAlternatesSrc(ps.idx);
								console.groupEnd();
								if(success){
									console.log("    Matching s",ps.idx," and d",cd.idx);
									cd.match=ps;
									ps.match=cd;
									dLabeled[idx]=-1;
									return true;
								}
							}
						};
						console.log("    Nothing found.");
						return false;
					}
					function swapAlternatesSrc(idx){
						console.log("    Src Swapping from ",idx);
						var cs = sources[idx], label = sLabeled[idx];
						var pd = cs.match;
						if(!pd){
							console.log("    Reached unmatched source! Begin swapping up.");
							sLabeled[idx]=-1;
							return true;
						}else{
							console.log("    Continuing with ",pd);
							var success = swapAlternatesDest(pd.idx);
							if(success){
								sLabeled[idx]=-1;
								return true;
							}
						}
						console.log("    Nothing found.");
						return false;
					}

				}
			}

			var tresult = new Array(n);
			for (var i = sources.length - 1; i >= 0; i--) {
				tresult[i] = sources[i].match ? sources[i].match.idx : null;
			};
			console.log("Temporary result is: ",tresult);
			if(!shouldContinue) break;
		}
		console.log("Building result");
		var result = new Array(n);
		for (var i = sources.length - 1; i >= 0; i--) {
			result[i] = sources[i].match.idx;
		};
		console.groupEnd();
		console.log("Result is: ",result);
		return result;
	}
	var getMatchingMemoized = _.memoize(getMatching);
	function graphIsFeasible(thresh){
		var feasible = _.every(getMatchingMemoized(thresh),function(v){
			return v!=null;
		});
		return feasible;
	}

	var flatsorted = _.flatten(C).sort(function(a,b){return a-b;});
	console.log("Flattened and sorted is ",flatsorted);
	var n = C.length;
	var lbound = flatsorted[0], ubound = flatsorted[flatsorted.length-1];
	console.log("Bounds are ",lbound,ubound);
	var checked = [];
	if(lbound == ubound){
		console.log("All values are the same!");
		return _.range(n);
	}
	while(true){
		var end   = _.indexOf(flatsorted,ubound,true),
			start = _.lastIndexOf(flatsorted,lbound,end)+1;

		console.log("Looking between ",start," and ",end," for values in ",lbound,ubound);
		if(start>=end) break;
		else{
			var mid = start + Math.floor((end-start)/2),
				median = flatsorted[mid];
			console.log("Mid value is ",mid," which makes the median of the remaining ",median);
			if(graphIsFeasible(median)){
				ubound = median;
				console.log("Graph is feasible. Shifting upper bound to median:",lbound,ubound);
			}else{
				lbound = median;
				console.log("Graph is not feasible. Shifting lower bound to median:",lbound,ubound);
			}
			checked[median]=true;
		}
	}
	console.log("Done looking!");
	if(!checked[lbound]){
		if(graphIsFeasible(lbound)){
			console.log("Graph at lower bound is feasible. Using it.");
			ubound = lbound;
		}
		else console.log("Graph at lower bound is not feasible. Using next.");
	}
	var final = ubound;
	var res = getMatchingMemoized(final);
	console.log("Got final matching ",res," using final threshhold ",final);
	return res;
}
function logMatrix(matrix){
	console.group();
	var startSize = (""+matrix.length).length;
	var midSize = 0;
	for (var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[i].length; j++) {
			midSize = Math.max(midSize, (""+matrix[i][j]).length);
		};
	};
	for (var i = 0; i < matrix.length; i++) {
		var str= pad(i,startSize)+": [ ";
		for (var j = 0; j < matrix[i].length; j++) {
			str+= pad(matrix[i][j],midSize)+" ";
		};
		str+="]";
		console.log(str);
	};
	console.groupEnd();
	function pad(val,digits){
		var str = ""+val;
		while(str.length<digits){
			str = " "+str;
		}
		return str;
	}
}
