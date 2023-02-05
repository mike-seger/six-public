set -e

out=out/develop
mkdir -p $out 
javac -d $out $(find src/test/java -name "*.java" | grep  -v "Test") $(find src/main/java | grep  "BigRational.java")
java -cp $out com.net128.apps.saron.jdk11plus.CompoundRateCalculator "$@"
