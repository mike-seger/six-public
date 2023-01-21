import java.io.*;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

import static java.time.temporal.ChronoUnit.DAYS;

public class CompoundRateCalculator {
    private final static MathContext mathContext = new MathContext(128, RoundingMode.HALF_UP);//MathContext.UNLIMITED;
    private final static BigDecimal commonFactor = new BigDecimal(36000, mathContext);
    public static void main(String[] args) throws IOException {
        System.out.println(new CompoundRateCalculator().compoundRates(args));
    }

    public static class CompoundRate {
        public CompoundRate(LocalDate startDate, LocalDate endDate, BigDecimal value) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.value = value;
        }

        LocalDate startDate;
        LocalDate endDate;
        BigDecimal value;
        public String toString() {
            return String.format("{\"startDate\": \"%s\", \"endDate\": \"%s\", \"valueD4\": \"%s\", \"valueD6\": \"%s\", \"value\": \"%s\"}\n",
                startDate, endDate, r4(value), r6(value), value);
        }
    }

    public static class Rate {
        public Rate(LocalDate date, BigDecimal value, BigDecimal weight) {
            this.date = date;
            this.value = value;
            this.weight = weight;
        }

        LocalDate date;
        BigDecimal value;
        BigDecimal weight;

        public String toString() {
            return String.format("{\"date\": \"%s\", \"value\": \"%.6f\", \"days\": \"%s\"}\n", date, value.doubleValue(), weight);
        }
    }

    private List<CompoundRate> compoundRates(String[] args) throws IOException {
        if (args.length != 3 && args.length!=4)
            throw new RuntimeException(getClass().getSimpleName() + " <rates-file> <startdate> <enddate>");
        var ratesFile = new File(args[0]);
        var startDate = LocalDate.parse(args[1]);
        var endDate = LocalDate.parse(args[2]);
        return compoundRates(ratesFile, startDate, endDate, args.length==4 && args[3].equals("all"));
    }

    public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate, boolean all) throws IOException {
        if(!ratesFile.exists()) throw new RuntimeException("ratesFile not found: "+ratesFile.getAbsolutePath());
        return compoundRates(getRateMap(ratesFile), startDate, endDate, all);
    }

    public List<CompoundRate> compoundRates(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean all) {
        var compoundRates = new ArrayList<CompoundRate>();
        var sd = startDate;
        var rateDates = new ArrayList<>(rateMap.keySet());
        if(rateDates.size()==0) throw new RuntimeException("No rates found");
        if(startDate.isBefore(rateDates.get(0)))
            throw new RuntimeException("Startdate is before first rate date: "+rateDates.get(0));
        if(startDate.isAfter(rateDates.get(rateDates.size()-1)))
            throw new RuntimeException("Enddate is after last rate date: "+rateDates.get(rateDates.size()-1));

        if(all)
            while(sd.isBefore(endDate.plusDays(1))) {
                var date = sd.plusDays(1);
                while (date.isBefore(endDate.plusDays(1))) {
                    compoundRates.add(compoundRate(rateMap, sd, date));
                    date = date.plusDays(1);
                }
                sd = sd.plusDays(1);
            }
        else compoundRates.add(compoundRate(rateMap, startDate, endDate));
        return compoundRates;
    }

    public CompoundRate compoundRate(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
        //System.out.println(rateMap.values());
        var date = startDate;
        var product = BigDecimal.ONE;
        while(date.isBefore(endDate)) {
            var rate = rateMap.get(date);
            date = date.plusDays(rate.weight.longValue());
            var weight = rate.weight;
            if(weight.compareTo(BigDecimal.ONE)>0 && !date.isBefore(endDate))
                weight = new BigDecimal(DAYS.between(rate.date, endDate), mathContext);
            var factor = rate.value.multiply(weight).divide(commonFactor, mathContext).add(BigDecimal.ONE);
            System.out.printf("# factor = 1 + weight * rate.value / 36000.0 = 1 + %d * %s / 36000 = %s\n",
                weight.intValue(), r6(rate.value), r16(factor));
            System.out.printf("# product * factor = %s * %s = %s\n",
                r16(product), r16(factor), r16(product.multiply(factor)));
            product = product.multiply(factor);
        }
        var result = product.subtract(BigDecimal.ONE).multiply(commonFactor).divide(new BigDecimal(DAYS.between(startDate, endDate), mathContext), mathContext);
        System.out.printf("# result = (product-1) * 36000.0 / DAYS.between(startDate, endDate) = (%f -1) * 36000.0 / %d = %f\n",
            product, DAYS.between(startDate, endDate), result.doubleValue());
        return new CompoundRate(startDate, endDate, result);
    }

    private static String r16(BigDecimal value) { return r(16, value); }
    private static String r6(BigDecimal value) { return r(6, value); }
    private static String r4(BigDecimal value) { return r(4, value); }
    private static String r(int digits, BigDecimal value) {
        return value.setScale(digits, RoundingMode.HALF_UP).toString();
    }

    private SortedMap<LocalDate, Rate> getRateMap(File ratesFile) throws IOException {
        TreeMap<LocalDate, Rate> rates = new TreeMap<>();
        try (BufferedReader br= new BufferedReader(new FileReader(ratesFile))) {
            String line;
            while((line  = br.readLine()) != null) {
                var tokens = line.trim().split("\t");
                if (tokens.length != 2) throw new RuntimeException(
                    "Rates File contains invalid line: \n" + line + "\nwith only " + tokens.length + " tokens instead of 2");
                if(!line.matches("[0-9-]*\t[0-9.-]*")) continue;
                var date = parseDate(tokens[0]);
                rates.put(date, new Rate(date, new BigDecimal(tokens[1], mathContext),BigDecimal.ONE));
            }
        }
        return fillGaps(rates);
    }

    private SortedMap<LocalDate, Rate> fillGaps(SortedMap<LocalDate, Rate> rates) {
        if(rates.size()==0) return rates;
        var dates = new ArrayList<>(rates.keySet());
        var previousDay = dates.get(0);
        for(var d : dates) {
            var offset = BigDecimal.ONE;
            var previousRate = rates.get(previousDay);
            while(previousDay.plusDays(offset.intValue()).isBefore(d)) offset = offset.add(BigDecimal.ONE);
            previousRate.weight = offset;
            offset = BigDecimal.ONE;
            while(previousDay.plusDays(offset.intValue()).isBefore(d)) {
                var newDate = previousDay.plusDays(offset.intValue());
                rates.put(newDate, new Rate(newDate, previousRate.value, previousRate.weight.subtract(offset)));
                offset = offset.add(BigDecimal.ONE);
            }

            previousDay = d;
        }
        return rates;
    }

    private LocalDate parseDate(String dateString) {
        if(dateString.matches("[0-9]+-[0-9]+-[0-9]+")) return LocalDate.parse(dateString);
        return LocalDate.ofEpochDay(Long.parseLong(dateString)/(60*60*24)).plusDays(1);
    }
}