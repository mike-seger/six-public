import java.io.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.stream.Collectors;

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
        public Rate(LocalDate date, double value) {
            this.date = date;
            this.value = value;
        }

        LocalDate date;
        double value;

        public String toString() {
            return String.format("{\"date\": \"%s\" \", \"value\": \"%s\"}\n", date, value);
        }
    }

    private List<CompoundRate> compoundRates(String[] args) throws IOException {
        if (args.length != 3)
            throw new RuntimeException(getClass().getSimpleName() + " <rates-file> <startdate> <enddate>");
        var ratesFile = new File(args[0]);
        var startDate = LocalDate.parse(args[1]);
        var endDate = LocalDate.parse(args[2]);
        return compoundRates(ratesFile, startDate, endDate);
    }

    public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate) throws IOException {
        if(!ratesFile.exists()) throw new RuntimeException("ratesFile not found: "+ratesFile.getAbsolutePath());
        return compoundRates(getRateMap(ratesFile), startDate, endDate);
    }

    public List<CompoundRate> compoundRates(SortedMap<LocalDate, Double> rateMap, LocalDate startDate, LocalDate endDate) {
        var compoundRates = new ArrayList<CompoundRate>();
        var sd = startDate;
        while(sd.isBefore(endDate)) {
            var date = sd.plusDays(1);
            while (date.isBefore(endDate)) {
                compoundRates.add(compoundRate(rateMap, sd, date));
                date = date.plusDays(1);
            }
            sd = sd.plusDays(1);
        }
        return compoundRates;
    }

    public CompoundRate compoundRate(SortedMap<LocalDate, Double> rateMap, LocalDate startDate, LocalDate endDate) {
        System.out.println(rateMap.entrySet().stream().map(e -> new Rate(e.getKey(), e.getValue())).collect(Collectors.toList()));
        var date = startDate;
        var product = 1.0;
        while(date.isBefore(endDate)) {
            var factor = (1 + rateMap.get(date)/36000.0);
            date = date.plusDays(1);
            product *= factor;
        }
        product -= 1;
        product *= 36000.0 / DAYS.between(startDate, endDate);
        return new CompoundRate(startDate, endDate, product);
    }

    private SortedMap<LocalDate, Double> getRateMap(File ratesFile) throws IOException {
        TreeMap<LocalDate, Double> rates = new TreeMap<>();
        try (BufferedReader br= new BufferedReader(new FileReader(ratesFile))) {
            String line;
            while((line  = br.readLine()) != null) {
                var tokens = line.trim().split("\t");
                if (tokens.length != 2) throw new RuntimeException(
                    "Rates File contains invalid line: \n" + line + "\nwith only " + tokens.length + " tokens instead of 2");
                rates.put(parseDate(tokens[0]), Double.parseDouble(tokens[1]));
            }
        }
        return fillDateGaps(rates);
    }

    private SortedMap<LocalDate, Double> fillDateGaps(SortedMap<LocalDate, Double> rates) throws IOException {
        if(rates.size()==0) return rates;
        var dates = new ArrayList<LocalDate>(rates.keySet());
        var previousDate = dates.get(0);
        for(var d : new ArrayList<>(rates.keySet())) {
            var offset = 1;
            while(previousDate.plusDays(offset).isBefore(d)) {
                rates.put(previousDate.plusDays(offset++), rates.get(previousDate));
            }
            rates.put(d, rates.get(d));
            previousDate = d;
        }
        return rates;
    }

    private LocalDate parseDate(String dateString) {
        if(dateString.matches("[0-9]+-[0-9]+-[0-9]+")) return LocalDate.parse(dateString);
        return LocalDate.ofEpochDay(Long.parseLong(dateString)/(60*60*24));
    }
}