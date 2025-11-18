import java.util.*;

/**
 * ORF401 - Electronic Commerce
 *
 * A Supporting Class for a More Complicated Server Side Processing Example
 */
public class Future extends Security
{
    private int     oi;



    /**
     * Construct a new Future object
     */
    public Future(String symbol, String line)
    {
	String tok;


	this.symbol = symbol;


	st = new StringTokenizer(line,",");

	// Parse for the date
	parseDate();

	// Parse for the open, high, low, close, and volume
	parseCommon();

	// Parse for the open interest
	tok = st.nextToken();
	oi = Integer.valueOf(tok).intValue();
    }





    /**
     * Return the open interest
     */
    public int getOpenInterest()
    {
	return oi;
    }



}
