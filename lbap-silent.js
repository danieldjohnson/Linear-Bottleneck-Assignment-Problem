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
	return lbap(matrix);
}
function lbap(C){
	function getMatching(thresh){
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

					}else{
						sources[i].adj.push(dests[j]);
						dests[j].adj.push(sources[i]);
					}
				}
			};
		};
		while(true){
			var sLabeled = new Array(n);
			var dLabeled = new Array(n);

			var sQueue = new Queue(), dQueue = new Queue();
			_.each(sources,function(src,idx){
				if(!src.match){
					sQueue.enqueue(src);
					sLabeled[idx]=1;
				}
			});
			var nLabel = 2;
			var shouldContinue = true;
			while(true){
				var found=[], cs, cd;
				while(!sQueue.isEmpty()){
					cs = sQueue.dequeue();
					for (var i = cs.adj.length - 1; i >= 0; i--) {
						var nd = cs.adj[i];
						if(dLabeled[nd.idx]) continue;
						dLabeled[nd.idx]=nLabel;
						dQueue.enqueue(nd);
						if(!nd.match){
							found.push(nd);
						}
					};
				}

				if(found.length==0){
					nLabel++;
					if(dQueue.isEmpty()){
						shouldContinue=false;
						break;
					}
					while(!dQueue.isEmpty()){
						cd = dQueue.dequeue();
						var ns = cd.match;
						sLabeled[ns.idx]=nLabel;
						sQueue.enqueue(ns);
					}
					nLabel++;
				}else{
					for (var i =  0; i < found.length; i++) {
						if(found[i].numIdentical == 0) continue;
						swapAlternatesDest(found[i].idx);
					};
					for (var i =  0; i < found.length; i++) {
						if(found[i].numIdentical != 0) continue;
						swapAlternatesDest(found[i].idx);
					};
					break;

					function swapAlternatesDest(idx){
						var cd = dests[idx], label = dLabeled[idx];
						for (var i = 0; i < cd.adj.length; i++) {
							var ps = cd.adj[i];
							if(sLabeled[ps.idx]==label-1){
								var success = swapAlternatesSrc(ps.idx);
								if(success){
									cd.match=ps;
									ps.match=cd;
									dLabeled[idx]=-1;
									return true;
								}
							}
						};
						return false;
					}
					function swapAlternatesSrc(idx){
						var cs = sources[idx], label = sLabeled[idx];
						var pd = cs.match;
						if(!pd){
							sLabeled[idx]=-1;
							return true;
						}else{
							var success = swapAlternatesDest(pd.idx);
							if(success){
								sLabeled[idx]=-1;
								return true;
							}
						}
						return false;
					}

				}
			}

			var tresult = new Array(n);
			for (var i = sources.length - 1; i >= 0; i--) {
				tresult[i] = sources[i].match ? sources[i].match.idx : null;
			};
			if(!shouldContinue) break;
		}
		var result = new Array(n);
		for (var i = sources.length - 1; i >= 0; i--) {
			result[i] = sources[i].match.idx;
		};
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
	var n = C.length;
	var lbound = flatsorted[0], ubound = flatsorted[flatsorted.length-1];
	var checked = [];
	if(lbound == ubound){
		return _.range(n);
	}
	while(true){
		var end   = _.indexOf(flatsorted,ubound,true),
			start = _.lastIndexOf(flatsorted,lbound,end)+1;

		if(start>=end) break;
		else{
			var mid = start + Math.floor((end-start)/2),
				median = flatsorted[mid];
			if(graphIsFeasible(median)){
				ubound = median;
			}else{
				lbound = median;
			}
			checked[median]=true;
		}
	}
	if(!checked[lbound]){
		if(graphIsFeasible(lbound)){
			ubound = lbound;
		}
	}
	var final = ubound;
	var res = getMatchingMemoized(final);
	return res;
}