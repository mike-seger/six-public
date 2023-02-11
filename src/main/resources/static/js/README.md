# example call
```
node saronCompoundCalculatorApp.mjs 2022-01-01 2022-12-31 true true | \
	grep start|tr -d '"{}[]' |tr ":" ","|\
	sed -e "s/^,//"|cut -d , -f2,4,6|\
	tee /tmp/1 ; wc -l /tmp/1
```
