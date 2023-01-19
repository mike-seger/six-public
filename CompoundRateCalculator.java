import java.io.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

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
        public Rate(LocalDate date, double value, int days) {
            this.date = date;
            this.value = value;
            this.days = days;
        }

        LocalDate date;
        double value;
        int days;

        public String toString() {
            return String.format("{\"date\": \"%s\" \", \"value\": \"%s\", \"days\": \"%s\"}\n", date, value, days);
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
        while(date.isBefore(endDate)) {
            var rate = rateMap.get(date);
            if(rate!=null) {
                var factor = (1 + rate.days * rate.value / 36000.0);
                product *= factor;
            }
            date = date.plusDays(rate.days);
        }
        product -= 1;
        product *= 36000.0 / DAYS.between(startDate, endDate);
        return new CompoundRate(startDate, endDate, product);
    }

    private SortedMap<LocalDate, Rate> getRateMap(File ratesFile) throws IOException {
        TreeMap<LocalDate, Rate> rates = new TreeMap<>();
        try (BufferedReader br= new BufferedReader(new FileReader(ratesFile))) {
            String line;
            while((line  = br.readLine()) != null) {
                var tokens = line.trim().split("\t");
                if (tokens.length != 2) throw new RuntimeException(
                    "Rates File contains invalid line: \n" + line + "\nwith only " + tokens.length + " tokens instead of 2");
                var date = parseDate(tokens[0]);
                rates.put(date, new Rate(date, Double.parseDouble(tokens[1]),1));
            }
        }
        return countDays(rates);
    }

    private SortedMap<LocalDate, Rate> countDays(SortedMap<LocalDate, Rate> rates) throws IOException {
        if(rates.size()==0) return rates;
        var dates = new ArrayList<LocalDate>(rates.keySet());
        var previousDate = dates.get(0);
        for(var d : new ArrayList<>(rates.keySet())) {
            var offset = 1;
            var rate = rates.get(previousDate);
            while(previousDate.plusDays(offset++).isBefore(d)) rate.days++;
            previousDate = d;
        }
        return rates;
    }

    private LocalDate parseDate(String dateString) {
        if(dateString.matches("[0-9]+-[0-9]+-[0-9]+")) return LocalDate.parse(dateString);
        return LocalDate.ofEpochDay(Long.parseLong(dateString)/(60*60*24)).plusDays(1);
    }
}