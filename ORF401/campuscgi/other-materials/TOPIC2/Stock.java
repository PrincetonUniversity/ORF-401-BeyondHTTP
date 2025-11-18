import java.util.*;

/**
 * ORF401 - Electronic Commerce
 *
 * A Supporting Class for a More Complicated Server Side Processing Example
 */
public class Stock extends Security
{


    /**
     * Construct a new Stock object
     */
    public Stock(String symbol, String line)
    {
	this.symbol = symbol;

	st = new StringTokenizer(line,",");

	// Parse for the date
	parseDate();

	// Parse for the open, high, low, close, and volume
	parseCommon();
    }
}
