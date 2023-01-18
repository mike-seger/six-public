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

# Links
- curl 'https://boerse.raiffeisen.ch/api/Chart/GetData?instruments=1526_OneYear,4961368,1526,1&chartPeriod=oneyear&noCache=2023-01-18T08:08:30.466Z' \

curl 'https://boerse.raiffeisen.ch/api/Chart/GetData?instruments=1526_OneYear,4961368,1526,1&chartPeriod=oneyear&noCache=2023-01-18T08:08:30.466Z' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: en-US,en;q=0.9,de;q=0.8' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Pragma: no-cache' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' \
  -H 'customer: raiffeisen-prod' \
  -H 'sec-ch-ua: "Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'targetSystem: prod' \
  -H 'x-culture: de-ch' \
  --compressed

curl 'https://boerse.raiffeisen.ch/api/Chart/GetData?instruments=1526_OneYear,4961368,1526,1&chartPeriod=oneyear&noCache=2023-01-18T08:08:30.466Z' \
  -H 'customer: raiffeisen-prod' \
  -H 'targetSystem: prod' \
  -H 'x-culture: de-ch'

curl 'https://boerse.raiffeisen.ch/api/Chart/GetData?instruments=1526_OneYear,4961368,1526,1&chartPeriod=oneyear&noCache=2' -H 'customer: raiffeisen-prod' -H 'targetSystem: prod'
