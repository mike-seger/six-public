package com.net128.apps.saron;

import lombok.Data;

import java.time.LocalDate;

@Data
public class Rate {
	public Rate(LocalDate date, BigRational value, int weight) {
		this.date = date;
		this.weight = weight;
		this.value = value;
		this.doubleValue = value.bigDecimal().doubleValue();
	}

	LocalDate date;
	int weight;
	BigRational value;
	double doubleValue;
}
