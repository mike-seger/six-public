# example call
```
s=$(date +%s)
node AppCli.mjs 2024-01-03 2024-08-16 true true | \
	grep start|tr -d '"{}[]' |tr ":" ","|\
	sed -e "s/^,//"|cut -d , -f2,4,6|\
	tee /tmp/1 ; wc -l /tmp/1
echo -n "time to complete (s): "
echo "$(date +%s) - $s"|bc
```

# profile
```
# this creates isolate-0xnnnnnnnnn-v8.log
node --prof AppCli.mjs ...
# process the log file
node --prof-process isolate-0xnnnnnnnnn-v8.log > processed.txt
```

# web workers
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

# apex charts
- https://apexcharts.com/
- https://apexcharts.com/javascript-chart-demos/dashboards/dark/
- https://apexcharts.com/graph-maker/
- https://apexcharts.com/javascript-chart-demos/area-charts/github-style/

# alternative charts
- https://dygraphs.com/
- https://pixlcore.com/software/pixl-chart/demos/single-layer.html
- http://mcaule.github.io/d3-timeseries/
