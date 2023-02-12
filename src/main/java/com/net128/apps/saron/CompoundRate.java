package com.net128.apps.saron;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompoundRate implements Comparable<CompoundRate> {
	@JsonProperty("value")
	public String getValue() {
		return decimal4(value.bigDecimal());
	}

	LocalDate startDate;
	LocalDate endDate;
	BigRational value;

	@Override
	public int compareTo(CompoundRate o) {
		return toString().compareTo(o.toString());
	}

	private static String decimal4(BigDecimal value) { return decimalRound(4, value); }
	private static String decimalRound(int digits, BigDecimal value) {
		return value.setScale(digits, RoundingMode.HALF_UP).toString();
	}
}
