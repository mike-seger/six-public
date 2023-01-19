# SIX Saron compound calculator

https://www.six-group.com/en/products-services/the-swiss-stock-exchange/market-data/indices/swiss-reference-rates/saron-calculator.html

# get saron rates for q4 2022
```
./saron-compound.sh 2022-10-01 92
find data -type f |sort| while read f; do 
	v="$(basename $f|sed -e "s/.*calcu.saron.//;s/.json//" |tr "\n_" "\t\t")$(jq -r .value $f)"
	echo $v
done >saron-20221001-20221231.tsv
```


# RFR calculators
- https://www.realisedrate.com/

# Commands

## Get SARON rates
```
baseurl="https://boerse.raiffeisen.ch/api/Chart/GetData"
curl "$baseurl?instruments=1526_OneYear,4961368,1526,1&chartPeriod=oneyear&noCache=2" \
	-H 'customer: raiffeisen-prod' -H 'targetSystem: prod' \
	| jq '.[].data' | tr -d " ]\n" | sed -e "s/,\[/\n/g"|tr , "\t"|\
	tr -d "["|awk '{ printf "%s\t%.6f\n", $1/1000, $2 }'
```

## Convert JSON to TSV
```
cat sr.json| jq -r '.[]|[.date, .value]|@tsv' > sr.tsv
```

## Convert epoch to iso date
```
cat saron-rates2022-ts.tsv | awk '{print strftime("%Y-%m-%d",$1) "\t" $2}'
```

