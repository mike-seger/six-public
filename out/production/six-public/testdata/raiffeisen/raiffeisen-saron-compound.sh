#!/bin/bash

#set -x

function getRate() {
    curl -s 'https://zinsalert.raiffeisen.ch/zinsalertapi/v1/SARONCompound' \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Content-Type: application/json' \
      -H 'DNT: 1' \
      -H 'Origin: https://zinsalert.raiffeisen.ch' \
      -H 'Referer: https://zinsalert.raiffeisen.ch/saron-rechner?language=de' \
      -H 'apikey: c905d90a-4b85-4c8e-a10b-1985f987e1b4' \
      --data-raw '{"startDate":"'$1'","endDate":"'$2'"}'
}

if [ $# != 2 ] ; then
	echo "Usage: $0 <start date (ISO: e.g. 20221016)> <n (number of days|ISO date)>"
	exit 1
fi

d=$(echo $1 | tr -c -d "0-9")
n=$(echo $2 | tr -c -d "0-9")

baseurl="https://www.six-group.com/en/products-services/the-swiss-stock-exchange/market-data/indices/swiss-reference-rates/saron-calculator/_jcr_content/sections/section/content/grid/par0/innerParsys/saron_compound_calcu.saron."

echo $d | grep -E "^2[0-9]{7}$" >/dev/null
if [[ $? != 0 ]] ; then
	echo "Date $1 is invalid"
	exit 1
fi

echo $n | grep -E "^2[0-9]{7}$" >/dev/null
if [[ $? == 0 ]] ; then
	n=$(echo $(( ($(date +%s -d $n) - $(date +%s -d $d) + 1)/(86400) + 1)))
fi

echo "n=$n"

for i in $(seq 1 $((n-1))); do
	echo $i >&2
	ds=$(date '+%d%m%C%y' -d "$d+$((i-1)) days") 
	isods=$(date '+%C%y-%m-%d' -d "$d+$((i-1)) days") 
	for j in $(seq $i $((n-1))); do
		de=$(date '+%d%m%C%y' -d "$d+$j days") 
		isode=$(date '+%C%y-%m-%d' -d "$d+$j days") 
		outfile="data/saron_compound_calcu.saron.${isods}_${isode}.json"
		if [ ! -f "$outfile" ] ; then
			getRate "${isods}" "${isode}" >"$outfile"
		fi
	done
done
