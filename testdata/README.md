# SIX Saron compound calculator

https://www.six-group.com/en/products-services/the-swiss-stock-exchange/market-data/indices/swiss-reference-rates/saron-calculator.html

# API: six compound SARON
example: 20220616-20220617
```
baseurl="https://www.six-group.com/en/products-services/the-swiss-stock-exchange/market-data/indices/swiss-reference-rates/saron-calculator/_jcr_content/sections/section/content/grid/par0/innerParsys/saron_compound_calcu.saron."
curl ${baseurl}16062022.17062022.json
```

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

# Links
- https://stackoverflow.com/questions/179427/how-to-resolve-a-java-rounding-double-issue
- https://www.mathsite.org/maths-factors/exponent-rules/rational-numbers-calculator.
- https://www.calculatorsoup.com/calculators/math/mixednumbers.php
- https://github.com/eobermuhlner/big-math
- html#c=simplify_algstepssimplify&v217=1%2F7*1%2F8
- https://commons.apache.org/proper/commons-lang/apidocs/org/apache/commons/lang3/math/Fraction.html
- https://github.com/javolution/jscience
- https://github.com/mtommila/apfloat
- http://www.apfloat.org/calculator/
- https://github.com/MrRefactoring/Fraction.java
- https://introcs.cs.princeton.edu/java/92symbolic/Rational.java.html
- https://introcs.cs.princeton.edu/java/92symbolic/BigRational.java.html
- https://indico.cern.ch/event/814979/contributions/3401175/attachments/1831476/3107964/FloatingPointArithmetic.pdf
