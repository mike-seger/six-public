# example call
```
s=$(date +%s)
node saronCompoundCalculatorApp.mjs 2022-01-01 2022-12-31 true true | \
	grep start|tr -d '"{}[]' |tr ":" ","|\
	sed -e "s/^,//"|cut -d , -f2,4,6|\
	tee /tmp/1 ; wc -l /tmp/1
echo -n "time to complete (s): "
echo "$(date +%s) - $s"|bc
```

# profile
```
# this creates isolate-0xnnnnnnnnn-v8.log
node --prof saronCompoundCalculatorApp.mjs ...
# process the log file
node --prof-process isolate-0xnnnnnnnnn-v8.log > processed.txt
```
