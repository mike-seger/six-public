#!/bin/bash

# generate 200 floating 200-day windows of saron compound rate sets 

set -e
#set -x

rm -fR /tmp/all
mkdir /tmp/all

start='2021-11-26'
end=$(date -d"$start + 200 days" +"%Y%m%d")
end="${end//-/}"
#start=$(date -d $start +%Y%m%d)
end=$(date -d $end +%Y%m%d)

while [[ "${start//-/}" -le "$end" ]]; do
	e=$(date -d"$start + 200 days" +"%Y-%m-%d")

	echo $start $e
	java -jar build/libs/saron-compound-public-0.0.1-SNAPSHOT.jar -all -allStartDates - $start $e true true 2>/dev/null |\
		grep start|sed -e 's/{"/\n{"/g' |\
		tr -d '"{}[]' |tr ":" ","|\
		sed -e "s/^,//"|cut -d , -f2,4,6 |grep -v "^ *$"> /tmp/all/"$start+$e.txt"

#	echo -n $(date -d $start +%Y-%m-%d)" "
#	echo $(date -d $e +%Y-%m-%d)" "
	start=$(date -d"$start + 1 day" +"%Y-%m-%d")
done


exit 0

s=$(date +%s)
java -jar build/libs/saron-compound-public-0.0.1-SNAPSHOT.jar -all -allStartDates - 2022-01-01 2022-12-31 true true |\
	grep start|sed -e 's/{"/\n{"/g' |\
	tr -d '"{}[]' |tr ":" ","|\
	sed -e "s/^,//"|cut -d , -f2,4,6 |grep -v "^ *$"> /tmp/1
[Awc -l /tmp/1
echo -n "time to complete (s): "
echo "$(date +%s) - $s"|bc
