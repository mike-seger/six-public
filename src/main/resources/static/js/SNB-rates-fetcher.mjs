export async function fetchTimeSeriesData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data
}

export function filteredTimeSeriesData(timeSeriesData, startDate, endDate, keyPattern) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = timeSeriesData.timeseries
        .filter(series => new RegExp(keyPattern).test(series.metadata.key)) // Match key with regex
        .map(series => {
            const filteredValues = series.values
                .filter(entry => {
                    const entryDate = new Date(`${entry.date}`);
                    return entryDate >= start && entryDate <= end;
                })
                .reduce((acc, entry) => {
                    const fullDate = `${entry.date}`;
                    acc[fullDate] = entry.value;
                    return acc;
                }, {});

            return {
                key: series.metadata.key,
                values: filteredValues
            };
        });

    return result.length > 0 ? result[0] : null;
}

export function convertToTSV(jsonData) {
    const entries = Object.entries(jsonData.values);
    let tsvOutput = 'Date\tSaronRate\n';
    entries.forEach(([date, rate]) => {
        tsvOutput += `${date}\t${rate}\n`;
    });
    return tsvOutput;
}