import java.io.*;
import java.time.LocalDate;
import java.util.*;

import static java.time.temporal.ChronoUnit.DAYS;

public class CompoundRateCalculator {
    public static void main(String[] args) throws IOException {
        System.out.println(new CompoundRateCalculator().compoundRates(args));
    }

    public static class CompoundRate {
        public CompoundRate(LocalDate startDate, LocalDate endDate, double value) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.value = value;
        }

        LocalDate startDate;
        LocalDate endDate;
        double value;
        public String toString() {
            return String.format("{\"startDate\": \"%s\", \"endDate\": \"%s\", \", \"value\": \"%s\"}\n",
                startDate, endDate, value);
        }
    }

    public static class Rate {
        public Rate(LocalDate date, double value, int weight) {
            this.date = date;
            this.value = value;
            this.weight = weight;
        }

        LocalDate date;
        double value;
        int weight;

        public String toString() {
            return String.format("{\"date\": \"%s\", \"value\": \"%s\", \"days\": \"%s\"}\n", date, value, weight);
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
        if(all)
            while(sd.isBefore(endDate)) {
                var date = sd.plusDays(1);
                while (date.isBefore(endDate)) {
                    compoundRates.add(compoundRate(rateMap, sd, date));
                    date = date.plusDays(1);
                }
                sd = sd.plusDays(1);
            }
        else compoundRates.add(compoundRate(rateMap, startDate, endDate));
        return compoundRates;
    }

    public CompoundRate compoundRate(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
        System.out.println(rateMap.values());
        var date = startDate;
        var product = 1.0;
        while(date.isBefore(endDate.plusDays(1))) {
            var rate = rateMap.get(date);
            date = date.plusDays(rate.weight);
            var weight = rate.weight;
            if(weight>1 && !date.isBefore(endDate)) weight = (int)DAYS.between(rate.date, endDate);
            var factor = 1 + weight * rate.value / 36000.0;
            System.out.printf("factor = 1 + weight * rate.value / 36000.0 = 1 + %d * %f / 36000 = %.16f\n", weight, rate.value, factor);
            System.out.printf("product * factor = %f * %f = %.16f\n", product, factor, product*factor);
            product *= factor;
        }
        System.out.printf("result = (product-1) * 36000.0 / DAYS.between(startDate, endDate) = (%f -1) * 36000.0 / %d = %.16f\n",
            product, DAYS.between(startDate, endDate), (product-1)*36000.0 / DAYS.between(startDate, endDate));
//        product -= 1;
//        product *= 36000.0 / DAYS.between(startDate, endDate);

        return new CompoundRate(startDate, endDate, (product-1)*36000.0 / DAYS.between(startDate, endDate));
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
                rates.put(date, new Rate(date, Double.parseDouble(tokens[1]),1));
            }
        }
        return countDays(rates);
    }

    private SortedMap<LocalDate, Rate> countDays(SortedMap<LocalDate, Rate> rates) {
        if(rates.size()==0) return rates;
        var dates = new ArrayList<>(rates.keySet());
        var previousDay = dates.get(0);
        for(var d : dates) {
            var offset = 1;
            var previousRate = rates.get(previousDay);
            while(previousDay.plusDays(offset).isBefore(d)) offset++;
            previousRate.weight = offset;
            offset = 1;
            while(previousDay.plusDays(offset).isBefore(d)) {
                var newDate = previousDay.plusDays(offset);
                rates.put(newDate, new Rate(newDate, previousRate.value, previousRate.weight-offset));
                offset++;
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