set -e

out=out/develop
mkdir -p $out 
javac -d out/develop *.java
java -cp $out CompoundRateCalculator "$@"
 
