#!/bin/bash

if [ $# != 2 ] ; then
	echo "Usage: $0 <start date (ISO: e.g. 20221016)> <n (number of days)>"
	exit 1
fi

d=$(echo $1 | tr -c -d "0-9")
n=$2

baseurl="https://www.six-group.com/en/products-services/the-swiss-stock-exchange/market-data/indices/swiss-reference-rates/saron-calculator/_jcr_content/sections/section/content/grid/par0/innerParsys/saron_compound_calcu.saron."

echo $d | grep -E "^2[0-9]{7}$" >/dev/null
if [[ $? != 0 ]] ; then
	echo "Date $1 is invalid"
	exit 1
fi

for i in $(seq 1 $((n-1))); do
	ds=$(date '+%d%m%C%y' -d "$d+$((i-1)) days") 
	isods=$(date '+%C%y-%m-%d' -d "$d+$((i-1)) days") 
	for j in $(seq $i $((n-1))); do
		de=$(date '+%d%m%C%y' -d "$d+$j days") 
		isode=$(date '+%C%y-%m-%d' -d "$d+$j days") 
		#echo "$ds $de"
		curl -s "${baseurl}${ds}.${de}.json" >"data/saron_compound_calcu.saron.${isods}_${isode}.json"
	done
done


exit 0
skip=2
for ds in $(cat q3-2022-dates.txt); do 
	for de in $(cat q3-2022-dates.txt | tail -n +$skip); do 		
		echo curl "${ds}.${de}.json"
	done
	skip=$((skip+1))
done
