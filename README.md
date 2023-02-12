doc/example1-saron.tsv 2018-09-06 2018-10-08
testdata/saron-rates2022.tsv 2022-07-06 2022-07-14

# example run
```
s=$(date +%s)
java -jar build/libs/saron-compound-public-0.0.1-SNAPSHOT.jar -all -allStartDates - 2022-01-01 2022-12-31 true true |\
    grep start|sed -e 's/{"/\n{"/g' |\
    tr -d '"{}[]' |tr ":" ","|\
    sed -e "s/^,//"|cut -d , -f2,4,6> /tmp/1
echo -n "time to complete (s): "
echo "$(date +%s) - $s"|bc

diff -y --suppress-common-lines <(cat testdata/saron-compound-2022-01-01_2022-12-31.csv.gz|gunzip|grep -Ev "(start)") <(cat /tmp/1)

java -jar build/libs/saron-compound-public-0.0.1-SNAPSHOT.jar -help
CompoundRateCalculatorCliApp [-all] [-allStartDates] [-rational] <rates-file> <startdate> <enddate>
```
